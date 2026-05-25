import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://ilinkai.weixin.qq.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrcode } = body;
    
    if (!qrcode) {
      return NextResponse.json(
        { success: false, error: "缺少二维码参数" },
        { status: 400 }
      );
    }
    
    const statusUrl = `${BASE_URL}/ilink/bot/get_qrcode_status?qrcode=${qrcode}`;
    const res = await fetch(statusUrl, {
      headers: { "iLink-App-ClientVersion": "1" },
    });
    const data = await res.json();
    
    return NextResponse.json({
      success: true,
      status: data.status,
      bot_token: data.bot_token,
      ilink_bot_id: data.ilink_bot_id,
      ilink_user_id: data.ilink_user_id,
      baseurl: data.baseurl,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
