import { NextResponse } from "next/server";
import { getMainUserId } from "../../../lib/multi-user-store";
import { sendReminderToUser } from "../../../lib/multi-user-webhook";

// 冷却期：统一 60 秒内只能发一次
const cooldowns: Record<string, number> = {};
const COOLDOWN_MS = 60_000;
const COOLDOWN_KEY = "global"; // 没主用户时用全局冷却

function getCooldownKey(): string {
  return getMainUserId() || COOLDOWN_KEY;
}

export async function GET() {
  const key = getCooldownKey();

  // 冷却检查
  const now = Date.now();
  const lastSent = cooldowns[key] ?? 0;
  if (now - lastSent < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 1000);
    return NextResponse.json({
      success: false,
      error: `操作太频繁，请 ${remaining} 秒后再试`,
    });
  }
  cooldowns[key] = now;

  // 有主用户 → 用他的凭证发送；没有 → 走环境变量回退
  const mainUserId = getMainUserId();
  const result = await sendReminderToUser(mainUserId || "_env_");

  // 发送失败则释放冷却
  if (!result.success) {
    delete cooldowns[key];
  }

  return NextResponse.json(result);
}