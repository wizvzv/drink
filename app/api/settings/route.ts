import { NextRequest, NextResponse } from "next/server";
import {
  getMainUserId,
  readUserSettings,
  writeUserSettings,
} from "../../../lib/multi-user-store";

function resolveUserId(request: NextRequest): string | null {
  return request.nextUrl.searchParams.get("userId") || getMainUserId();
}

export async function GET(request: NextRequest) {
  const userId = resolveUserId(request);
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "未设置主用户，请先扫码登录" },
      { status: 400 }
    );
  }

  const settings = readUserSettings(userId);
  return NextResponse.json({ success: true, settings });
}

export async function POST(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "未设置主用户，请先扫码登录" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const current = readUserSettings(userId);
    const updated = { ...current, ...body };
    writeUserSettings(userId, updated);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}