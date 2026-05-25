import { NextRequest, NextResponse } from "next/server";
import { getMainUserId } from "../../../lib/multi-user-store";
import { sendReminderToUser } from "../../../lib/multi-user-webhook";

// 冷却期：每用户 3 分钟内只能发一次（微信 API 限频较严）
const cooldowns: Record<string, number> = {};
const COOLDOWN_MS = 180_000;

function resolveUserId(request: NextRequest): string {
  return request.nextUrl.searchParams.get("userId") || getMainUserId() || "_env_";
}

export async function GET(request: NextRequest) {
  const userId = resolveUserId(request);
  const key = userId;

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

  const result = await sendReminderToUser(userId);

  // 发送失败则释放冷却
  if (!result.success) {
    delete cooldowns[key];
  }

  return NextResponse.json(result);
}