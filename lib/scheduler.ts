import cron from "node-cron";
import { readSettings } from "./store";
import { sendReminder } from "./webhook";

let task: cron.ScheduledTask | null = null;
let lastSentHour = -1;

export function startScheduler(): void {
  if (task) {
    task.stop();
  }

  task = cron.schedule("* * * * *", async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const settings = readSettings();

    if (!settings.enabled) return;

    if (currentHour < settings.startHour || currentHour >= settings.endHour) return;

    if (currentMinute !== 0) return;

    if (currentHour === lastSentHour) return;
    lastSentHour = currentHour;

    console.log(`[${now.toISOString()}] 发送喝水提醒...`);
    const result = await sendReminder();
    if (result.success) {
      console.log(`[${now.toISOString()}] 提醒发送成功`);
    } else {
      console.error(`[${now.toISOString()}] 发送失败:`, result.error);
    }
  });

  console.log("喝水提醒定时任务已启动 (每小时检查)");
}

export function stopScheduler(): void {
  if (task) {
    task.stop();
    task = null;
  }
  console.log("喝水提醒定时任务已停止");
}

export function resetLastSentHour(): void {
  lastSentHour = -1;
}