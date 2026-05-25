import { NextRequest, NextResponse } from "next/server";
import {
  getMainUserId,
  readUserSettings,
  writeUserSettings,
} from "../../../lib/multi-user-store";

export async function GET() {
  const mainUserId = getMainUserId();
  if (!mainUserId) {
    return NextResponse.json(
      { success: false, error: "未设置主用户，请先扫码登录" },
      { status: 400 }
    );
  }

  const settings = readUserSettings(mainUserId);
  return NextResponse.json({ success: true, settings });
}

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
    const current = readUserSettings(mainUserId);
    const updated = { ...current, ...body };
    writeUserSettings(mainUserId, updated);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}