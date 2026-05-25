import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
const RECORDS_PATH = path.join(DATA_DIR, "records.json");

export interface Settings {
  enabled: boolean;
  startHour: number;
  endHour: number;
  intervalMinutes: number;
  dailyGoalCups: number;
  cupVolumeMl: number;
}

export interface DrinkLog {
  time: string;
  ml: number;
}

export interface DayRecord {
  cups: number;
  totalMl: number;
  logs: DrinkLog[];
}

export type Records = Record<string, DayRecord>;

const defaultSettings: Settings = {
  enabled: true,
  startHour: 8,
  endHour: 22,
  intervalMinutes: 60,
  dailyGoalCups: 8,
  cupVolumeMl: 250,
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readSettings(): Settings {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    writeSettings(defaultSettings);
    return { ...defaultSettings };
  }
}

export function writeSettings(settings: Settings): void {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

export function readRecords(): Records {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(RECORDS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeRecords(records: Records): void {
  ensureDataDir();
  fs.writeFileSync(RECORDS_PATH, JSON.stringify(records, null, 2), "utf-8");
}

export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDrinkRecord(ml: number): DayRecord {
  const records = readRecords();
  const today = getTodayStr();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const dayRecord: DayRecord = records[today] || { cups: 0, totalMl: 0, logs: [] };
  dayRecord.cups += 1;
  dayRecord.totalMl += ml;
  dayRecord.logs.push({ time: timeStr, ml });

  records[today] = dayRecord;
  writeRecords(records);
  return dayRecord;
}

export function getTodayRecord(): DayRecord | null {
  const records = readRecords();
  const today = getTodayStr();
  return records[today] || null;
}

export function getConsecutiveDays(): number {
  const records = readRecords();
  const today = new Date();
  let count = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;

    if (records[key] && records[key].cups > 0) {
      count++;
    } else {
      break;
    }
  }
  return count;
}