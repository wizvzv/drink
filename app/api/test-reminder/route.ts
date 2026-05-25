import { NextResponse } from "next/server";
import { getMainUserId } from "../../../lib/multi-user-store";
import { sendReminderToUser } from "../../../lib/multi-user-webhook";

// 冷却期：同一用户 60 秒内只能发一次
const cooldowns: Record<string, number> = {};
const COOLDOWN_MS = 60_000;

export async function GET() {
  const mainUserId = getMainUserId();
  if (!mainUserId) {
    return NextResponse.json({ success: false, error: "未设置主用户，请先扫码登录" });
  }

  const now = Date.now();
  const lastSent = cooldowns[mainUserId] ?? 0;
  if (now - lastSent < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 1000);
    return NextResponse.json({
      success: false,
      error: `操作太频繁，请 ${remaining} 秒后再试`,
    });
  }

  cooldowns[mainUserId] = now;

  const result = await sendReminderToUser(mainUserId);

  // 如果发送失败（含限频），释放冷却让用户可以重试
  if (!result.success) {
    delete cooldowns[mainUserId];
  }

  return NextResponse.json(result);
}