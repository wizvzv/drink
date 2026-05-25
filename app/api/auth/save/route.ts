import { NextRequest, NextResponse } from "next/server";
import {
  addOrUpdateUser,
  writeUserCredentials,
  writeUserSettings,
  getMainUserId,
  setMainUserId,
} from "../../../../lib/multi-user-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, accountId, userId, baseUrl, userName } = body;
    
    if (!token || !userId) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }
    
    const toUser = userId.includes("@im.wechat") ? userId : `${userId}@im.wechat`;
    
    const credentials = {
      WXCLAW_TOKEN: token,
      WXCLAW_BASE_URL: baseUrl || "https://ilinkai.weixin.qq.com",
      WXCLAW_TO_USER: toUser,
      accountId,
      userId,
    };
    
    addOrUpdateUser(userId, userName || `用户_${userId.substring(0, 6)}`);
    writeUserCredentials(userId, credentials);
    writeUserSettings(userId, {
      enabled: true,
      startHour: 8,
      endHour: 22,
      intervalMinutes: 60,
      dailyGoalCups: 8,
      cupVolumeMl: 250,
    });
    
    // 第一个登录的用户自动设为主控制人
    if (!getMainUserId()) {
      setMainUserId(userId);
      console.log(`[auth/save] 设置主用户: userId=${userId}, toUser=${toUser}`);
    }
    
    console.log(`[auth/save] 凭证已保存: userId=${userId}, hasToken=${!!token}`);
    
    return NextResponse.json({
      success: true,
      message: "凭证已保存",
      userId,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
