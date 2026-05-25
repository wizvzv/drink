import cron from "node-cron";
import { getAllUsers, readUserSettings, getUserTodayRecord, getUserConsecutiveDays } from "./multi-user-store";
import { sendReminderToUser } from "./multi-user-webhook";

let task: cron.ScheduledTask | null = null;
const lastSentHours: Record<string, number> = {};

export function startMultiUserScheduler(): void {
  if (task) {
    task.stop();
  }

  task = cron.schedule("* * * * *", async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentMinute !== 0) return;

    const users = getAllUsers();
    
    for (const user of users) {
      const userId = user.userId;
      const settings = readUserSettings(userId);

      if (!settings.enabled) {
        console.log(`[用户 ${user.name}] 提醒已关闭，跳过`);
        continue;
      }

      if (currentHour < settings.startHour || currentHour >= settings.endHour) {
        continue;
      }

      const lastSentHour = lastSentHours[userId] ?? -1;
      if (currentHour === lastSentHour) {
        continue;
      }
      lastSentHours[userId] = currentHour;

      console.log(`[${now.toISOString()}] 发送喝水提醒给 [用户 ${user.name}]...`);
      const result = await sendReminderToUser(userId);
      if (result.success) {
        console.log(`[${now.toISOString()}] [用户 ${user.name}] 提醒发送成功`);
      } else {
        console.error(`[${now.toISOString()}] [用户 ${user.name}] 发送失败:`, result.error);
      }
    }
  });

  console.log("多用户喝水提醒定时任务已启动");
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
