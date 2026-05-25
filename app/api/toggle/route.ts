import { NextResponse } from "next/server";
import { readSettings, writeSettings } from "../../../lib/store";
import { resetLastSentHour } from "../../../lib/scheduler";

export async function POST() {
  const settings = readSettings();
  settings.enabled = !settings.enabled;
  writeSettings(settings);
  resetLastSentHour();
  return NextResponse.json({ success: true, enabled: settings.enabled });
}