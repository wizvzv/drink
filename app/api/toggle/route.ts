import { NextResponse } from "next/server";
import {
  getMainUserId,
  readUserSettings,
  writeUserSettings,
} from "../../../lib/multi-user-store";
import { resetUserLastSentHour } from "../../../lib/multi-user-scheduler";

export async function POST() {
  const mainUserId = getMainUserId();
  if (!mainUserId) {
    return NextResponse.json(
      { success: false, error: "未设置主用户，请先扫码登录" },
      { status: 400 }
    );
  }

  const settings = readUserSettings(mainUserId);
  settings.enabled = !settings.enabled;
  writeUserSettings(mainUserId, settings);
  resetUserLastSentHour(mainUserId);
  return NextResponse.json({ success: true, enabled: settings.enabled });
}