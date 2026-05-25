import { NextRequest, NextResponse } from "next/server";
import {
  getMainUserId,
  addUserDrinkRecord,
  readUserSettings,
} from "../../../lib/multi-user-store";

export async function POST(request: NextRequest) {
  try {
    const mainUserId = getMainUserId();
    if (!mainUserId) {
      return NextResponse.json(
        { success: false, error: "未设置主用户，请先扫码登录" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const ml = body.ml || readUserSettings(mainUserId).cupVolumeMl;
    const record = addUserDrinkRecord(mainUserId, ml);
    return NextResponse.json({ success: true, record });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}