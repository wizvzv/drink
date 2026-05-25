import { NextRequest, NextResponse } from "next/server";
import { writeSettings } from "../../../../lib/store";

const DATA_DIR = process.cwd();
const CREDENTIALS_PATH = `${DATA_DIR}/data/clawbot-credentials.json`;

import fs from "node:fs";
import path from "node:path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, accountId, userId, baseUrl } = body;
    
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
    
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2), "utf-8");
    
    return NextResponse.json({
      success: true,
      message: "凭证已保存",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
