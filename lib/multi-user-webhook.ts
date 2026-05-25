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
  const c = getClient(userId);
  if (!c) {
    return { success: false, error: "用户凭证未设置" };
  }

  const credentials = readUserCredentials(userId);
  if (!credentials) {
    return { success: false, error: "用户凭证不存在" };
  }

  const toUser = credentials.WXCLAW_TO_USER;
  if (!toUser) {
    return { success: false, error: "WXCLAW_TO_USER 未设置" };
  }

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
