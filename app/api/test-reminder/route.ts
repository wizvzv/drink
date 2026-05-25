import { NextResponse } from "next/server";
import { getMainUserId } from "../../../lib/multi-user-store";
import { sendReminderToUser } from "../../../lib/multi-user-webhook";

export async function GET() {
  const mainUserId = getMainUserId();
  if (!mainUserId) {
    return NextResponse.json({ success: false, error: "未设置主用户，请先扫码登录" });
  }

  const result = await sendReminderToUser(mainUserId);
  return NextResponse.json(result);
}