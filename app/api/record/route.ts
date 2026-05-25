import { NextRequest, NextResponse } from "next/server";
import { addDrinkRecord, readSettings } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ml = body.ml || readSettings().cupVolumeMl;
    const record = addDrinkRecord(ml);
    return NextResponse.json({ success: true, record });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}