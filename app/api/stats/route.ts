import { NextResponse } from "next/server";
import { readSettings, getTodayRecord, getConsecutiveDays } from "../../../lib/store";

export async function GET() {
  const settings = readSettings();
  const todayRecord = getTodayRecord();
  const consecutiveDays = getConsecutiveDays();

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