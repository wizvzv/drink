import { WxClawClient } from "@claw-lab/wxclawbot-cli";
import { getRandomMessage } from "./messages";
import {
  readUserSettings,
  getUserTodayRecord,
  getUserConsecutiveDays,
  getTodayStr,
  readUserCredentials,
} from "./multi-user-store";

export interface SendResult {
  success: boolean;
  error?: string;
}

const clientsCache: Record<string, WxClawClient> = {};

// 全局发送冷却：同一用户 30 秒内只发一次（防止调度器 + 手动测试冲突）
const sendCooldowns: Record<string, number> = {};
const SEND_COOLDOWN_MS = 30_000;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const last = sendCooldowns[userId] ?? 0;
  if (now - last < SEND_COOLDOWN_MS) return true;
  sendCooldowns[userId] = now;
  return false;
}

function getClient(userId: string): WxClawClient | null {
  if (clientsCache[userId]) return clientsCache[userId];

  const credentials = readUserCredentials(userId);
  if (!credentials) return null;

  const botId = credentials.WXCLAW_TOKEN.split("@")[0];
  
  const client = new WxClawClient({
    baseUrl: credentials.WXCLAW_BASE_URL,
    token: credentials.WXCLAW_TOKEN,
    botId: botId,
  });

  clientsCache[userId] = client;
  return client;
}

export async function sendReminderToUser(userId: string): Promise<SendResult> {
  // 限频保护
  if (isRateLimited(userId)) {
    return { success: false, error: "发送太频繁，请稍后再试 (ret=-2)" };
  }

  // 优先使用用户凭证，没有则回退到环境变量
  let token = process.env.WXCLAW_TOKEN || "";
  let baseUrl = process.env.WXCLAW_BASE_URL || "https://ilinkai.weixin.qq.com";
  let toUser = process.env.WXCLAW_TO_USER || "";

  const credentials = readUserCredentials(userId);
  if (credentials) {
    token = credentials.WXCLAW_TOKEN;
    baseUrl = credentials.WXCLAW_BASE_URL;
    toUser = credentials.WXCLAW_TO_USER;
  }

  if (!token) {
    return { success: false, error: "未配置 ClawBot 凭证，请在 Railway 设置 WXCLAW_TOKEN 环境变量或扫码登录" };
  }

  if (!toUser) {
    return { success: false, error: "未配置 WXCLAW_TO_USER" };
  }

  // 复用或创建 client
  if (!clientsCache[userId] && token) {
    const botId = token.split("@")[0];
    clientsCache[userId] = new WxClawClient({
      baseUrl,
      token,
      botId,
    });
  }
  const c = clientsCache[userId];

  const settings = readUserSettings(userId);
  const todayRecord = getUserTodayRecord(userId);
  const days = getUserConsecutiveDays(userId);
  const cups = todayRecord?.cups ?? 0;
  const remaining = Math.max(0, settings.dailyGoalCups - cups);
  const totalMl = todayRecord?.totalMl ?? 0;
  const progress = Math.min(100, Math.round((cups / settings.dailyGoalCups) * 100));

  const message = getRandomMessage(days, remaining, "主人");
  const todayStr = getTodayStr();

  const text =
`💧 喝水提醒 💧

${message}

---
📅 ${todayStr}
🥤 今日喝水：${cups}/${settings.dailyGoalCups} 杯 (${totalMl}ml)
📊 进度：${progress}%
🔥 连续坚持：${days} 天

📝 记录喝水：${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/drink`;

  try {
    const result = await c.sendText(toUser, text);
    if (result.ok) {
      return { success: true };
    }
    return { success: false, error: result.error || "发送失败" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
