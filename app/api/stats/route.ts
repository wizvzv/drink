import { NextResponse } from "next/server";
import {
  getMainUserId,
  readUserSettings,
  getUserTodayRecord,
  getUserConsecutiveDays,
} from "../../../lib/multi-user-store";

export async function GET() {
  const mainUserId = getMainUserId();

  // 没有主用户时返回空数据
  if (!mainUserId) {
    return NextResponse.json({
      success: true,
      stats: {
        today: { cups: 0, totalMl: 0, logs: [] },
        consecutiveDays: 0,
        enabled: false,
        dailyGoalCups: 8,
        cupVolumeMl: 250,
        startHour: 8,
        endHour: 22,
        nextReminder: null,
      },
    });
  }

  const settings = readUserSettings(mainUserId);
  const todayRecord = getUserTodayRecord(mainUserId);
  const consecutiveDays = getUserConsecutiveDays(mainUserId);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let nextReminder: string | null = null;
  if (settings.enabled) {
    for (let h = currentHour; h < settings.endHour; h++) {
      if (h > currentHour || (h === currentHour && currentMinute < 60)) {
        if (h >= settings.startHour) {
          nextReminder = `${String(h).padStart(2, "0")}:00`;
          break;
        }
      }
    }
    if (!nextReminder && currentHour < settings.startHour) {
      nextReminder = `${String(settings.startHour).padStart(2, "0")}:00`;
    }
  }

  return NextResponse.json({
    success: true,
    stats: {
      today: todayRecord || { cups: 0, totalMl: 0, logs: [] },
      consecutiveDays,
      enabled: settings.enabled,
      dailyGoalCups: settings.dailyGoalCups,
      cupVolumeMl: settings.cupVolumeMl,
      startHour: settings.startHour,
      endHour: settings.endHour,
      nextReminder,
    },
  });
}