import { NextResponse } from "next/server";
import { sendReminder } from "../../../lib/webhook";

export async function GET() {
  const result = await sendReminder();
  return NextResponse.json(result);
}