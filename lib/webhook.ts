import { WxClawClient } from "@claw-lab/wxclawbot-cli";
import { getRandomMessage } from "./messages";
import { readSettings, getTodayRecord, getConsecutiveDays, getTodayStr } from "./store";

const TO_USER = process.env.WXCLAW_TO_USER || "";
const TOKEN = process.env.WXCLAW_TOKEN || "";
const BASE_URL = process.env.WXCLAW_BASE_URL || "https://ilinkai.weixin.qq.com";

export interface SendResult {
  success: boolean;
  error?: string;
}

let client: WxClawClient | null = null;

function getClient(): WxClawClient | null {
  if (client) return client;

  if (!TOKEN) return null;

  const botId = TOKEN.split("@")[0];
  
  client = new WxClawClient({
    baseUrl: BASE_URL,
    token: TOKEN,
    botId: botId,
  });

  return client;
}

export async function sendReminder(): Promise<SendResult> {
  const c = getClient();
  if (!c) {
    return { success: false, error: "WXCLAW_TOKEN 未设置，请检查 Railway 环境变量配置" };
  }

  if (!TO_USER) {
    return { success: false, error: "WXCLAW_TO_USER 未设置" };
  }

  const settings = readSettings();
  const todayRecord = getTodayRecord();
  const days = getConsecutiveDays();
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
    const result = await c.sendText(TO_USER, text);
    if (result.ok) {
      return { success: true };
    }
    return { success: false, error: result.error || "发送失败" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}