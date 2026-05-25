import { NextRequest, NextResponse } from "next/server";
import {
  getMainUserId,
  readUserSettings,
  writeUserSettings,
} from "../../../lib/multi-user-store";
import { resetUserLastSentHour } from "../../../lib/multi-user-scheduler";

export async function POST(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") || getMainUserId();

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "未设置主用户，请先扫码登录" },
      { status: 400 }
    );
  }

  const settings = readUserSettings(userId);
  settings.enabled = !settings.enabled;
  writeUserSettings(userId, settings);
  resetUserLastSentHour(userId);
  return NextResponse.json({ success: true, enabled: settings.enabled });
}