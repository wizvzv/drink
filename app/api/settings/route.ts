import { NextRequest, NextResponse } from "next/server";
import { readSettings, writeSettings } from "../../../lib/store";

export async function GET() {
  const settings = readSettings();
  const { ...safe } = settings;
  return NextResponse.json({ success: true, settings: safe });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = readSettings();
    const updated = { ...current, ...body };
    writeSettings(updated);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}