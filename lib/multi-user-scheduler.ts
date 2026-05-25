import cron from "node-cron";
import { getAllUsers, readUserSettings } from "./multi-user-store";
import { sendReminderToUser } from "./multi-user-webhook";

let task: cron.ScheduledTask | null = null;
const lastSentHours: Record<string, number> = {};

// 重试队列：记录发送失败的用户，每 5 分钟重试一次
interface RetryEntry {
  userId: string;
  userName: string;
  retryCount: number;
  lastRetryAt: number;
}
const retryQueue: Record<string, RetryEntry> = {};
const MAX_RETRIES = 12; // 最多重试 12 次（约 1 小时）
const RETRY_INTERVAL_MS = 5 * 60 * 1000; // 每 5 分钟重试一次

async function sendToUser(user: { userId: string; name: string }): Promise<boolean> {
  const userId = user.userId;
  const settings = readUserSettings(userId);

  if (!settings.enabled) {
    console.log(`[用户 ${user.name}] 提醒已关闭，跳过`);
    return false;
  }

  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour < settings.startHour || currentHour >= settings.endHour) {
    return false;
  }

  console.log(`[${now.toISOString()}] 发送喝水提醒给 [用户 ${user.name}]...`);
  const result = await sendReminderToUser(userId);
  if (result.success) {
    console.log(`[${now.toISOString()}] [用户 ${user.name}] 提醒发送成功`);
    return true;
  }

  console.error(`[${now.toISOString()}] [用户 ${user.name}] 发送失败:`, result.error);
  return false;
}

export function startMultiUserScheduler(): void {
  if (task) {
    task.stop();
  }

  task = cron.schedule("* * * * *", async () => {
    const now = new Date();
    const currentMinute = now.getMinutes();

    // —— 整点发送 ——
    if (currentMinute === 0) {
      const users = getAllUsers();
      for (const user of users) {
        const userId = user.userId;
        const currentHour = now.getHours();

        // 检查本小时是否已发过
        const lastSentHour = lastSentHours[userId] ?? -1;
        if (currentHour === lastSentHour) continue;
        lastSentHours[userId] = currentHour;

        const ok = await sendToUser(user);
        if (!ok) {
          // 发送失败（含限频），加入重试队列
          retryQueue[userId] = { userId, userName: user.name, retryCount: 0, lastRetryAt: Date.now() };
        }
      }
    }

    // —— 每 5 分钟重试失败的发送 ——
    if (currentMinute % 5 === 0) {
      for (const [userId, entry] of Object.entries(retryQueue)) {
        if (entry.retryCount >= MAX_RETRIES) {
          console.log(`[用户 ${entry.userName}] 重试已达上限 ${MAX_RETRIES} 次，放弃`);
          delete retryQueue[userId];
          continue;
        }

        const elapsed = Date.now() - entry.lastRetryAt;
        if (elapsed < RETRY_INTERVAL_MS) continue;

        entry.retryCount++;
        entry.lastRetryAt = Date.now();

        console.log(`[用户 ${entry.userName}] 第 ${entry.retryCount} 次重试...`);
        const ok = await sendToUser({ userId, name: entry.userName });
        if (ok) {
          delete retryQueue[userId];
        }
      }
    }
  });

  console.log("多用户喝水提醒定时任务已启动 (整点发送 + 5分钟重试)");
}

export function stopMultiUserScheduler(): void {
  if (task) {
    task.stop();
    task = null;
  }
  console.log("多用户喝水提醒定时任务已停止");
}

export function resetUserLastSentHour(userId: string): void {
  delete lastSentHours[userId];
}
