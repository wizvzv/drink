import { NextRequest, NextResponse } from "next/server";
import {
  getMainUserId,
  addUserDrinkRecord,
  readUserSettings,
} from "../../../lib/multi-user-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || getMainUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "未设置主用户，请先扫码登录" },
        { status: 400 }
      );
    }

    const ml = body.ml || readUserSettings(userId).cupVolumeMl;
    const record = addUserDrinkRecord(userId, ml);
    return NextResponse.json({ success: true, record });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}