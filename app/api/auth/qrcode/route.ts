import { NextResponse } from "next/server";

const BASE_URL = "https://ilinkai.weixin.qq.com";

export async function GET() {
  try {
    const url = `${BASE_URL}/ilink/bot/get_bot_qrcode?bot_type=3`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.ret !== 0) {
      return NextResponse.json(
        { success: false, error: "获取二维码失败" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      qrcode: data.qrcode,
      qrcodeImg: data.qrcode_img_content,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
