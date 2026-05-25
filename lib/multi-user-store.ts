import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_INDEX_PATH = path.join(DATA_DIR, "users-index.json");

export interface UserInfo {
  userId: string;
  name: string;
  createdAt: string;
  lastLoginAt: string;
}

export type UsersIndex = Record<string, UserInfo>;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getUserDataDir(userId: string): string {
  return path.join(DATA_DIR, "users", userId);
}

export function ensureUserDataDir(userId: string): void {
  const userDir = getUserDataDir(userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
}

export function readUsersIndex(): UsersIndex {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(USERS_INDEX_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeUsersIndex(index: UsersIndex): void {
  ensureDataDir();
  fs.writeFileSync(USERS_INDEX_PATH, JSON.stringify(index, null, 2), "utf-8");
}

export function addOrUpdateUser(userId: string, name: string): UserInfo {
  const index = readUsersIndex();
  const now = new Date().toISOString();
  
  const userInfo: UserInfo = index[userId] || {
    userId,
    name,
    createdAt: now,
    lastLoginAt: now,
  };
  
  userInfo.lastLoginAt = now;
  if (name) {
    userInfo.name = name;
  }
  
  index[userId] = userInfo;
  writeUsersIndex(index);
  
  ensureUserDataDir(userId);
  
  return userInfo;
}

export function getAllUsers(): UserInfo[] {
  const index = readUsersIndex();
  return Object.values(index).sort((a, b) => 
    new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime()
  );
}

export function getUserInfo(userId: string): UserInfo | null {
  const index = readUsersIndex();
  return index[userId] || null;
}

export function deleteUser(userId: string): boolean {
  const index = readUsersIndex();
  if (!index[userId]) return false;
  
  delete index[userId];
  writeUsersIndex(index);
  
  const userDir = getUserDataDir(userId);
  if (fs.existsSync(userDir)) {
    fs.rmSync(userDir, { recursive: true, force: true });
  }
  
  return true;
}

export function getUserSettingsPath(userId: string): string {
  return path.join(getUserDataDir(userId), "settings.json");
}

export function getUserRecordsPath(userId: string): string {
  return path.join(getUserDataDir(userId), "records.json");
}

export function getUserCredentialsPath(userId: string): string {
  return path.join(getUserDataDir(userId), "clawbot-credentials.json");
}

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

export function readUserSettings(userId: string): Settings {
  ensureUserDataDir(userId);
  const settingsPath = getUserSettingsPath(userId);
  try {
    const raw = fs.readFileSync(settingsPath, "utf-8");
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    writeUserSettings(userId, defaultSettings);
    return { ...defaultSettings };
  }
}

export function writeUserSettings(userId: string, settings: Settings): void {
  ensureUserDataDir(userId);
  const settingsPath = getUserSettingsPath(userId);
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
}

export function readUserRecords(userId: string): Records {
  ensureUserDataDir(userId);
  const recordsPath = getUserRecordsPath(userId);
  try {
    const raw = fs.readFileSync(recordsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeUserRecords(userId: string, records: Records): void {
  ensureUserDataDir(userId);
  const recordsPath = getUserRecordsPath(userId);
  fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2), "utf-8");
}

export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addUserDrinkRecord(userId: string, ml: number): DayRecord {
  const records = readUserRecords(userId);
  const today = getTodayStr();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const dayRecord: DayRecord = records[today] || { cups: 0, totalMl: 0, logs: [] };
  dayRecord.cups += 1;
  dayRecord.totalMl += ml;
  dayRecord.logs.push({ time: timeStr, ml });

  records[today] = dayRecord;
  writeUserRecords(userId, records);
  return dayRecord;
}

export function getUserTodayRecord(userId: string): DayRecord | null {
  const records = readUserRecords(userId);
  const today = getTodayStr();
  return records[today] || null;
}

export function getUserConsecutiveDays(userId: string): number {
  const records = readUserRecords(userId);
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

export function readUserCredentials(userId: string): {
  WXCLAW_TOKEN: string;
  WXCLAW_BASE_URL: string;
  WXCLAW_TO_USER: string;
  accountId: string;
  userId: string;
} | null {
  ensureUserDataDir(userId);
  const credsPath = getUserCredentialsPath(userId);
  try {
    const raw = fs.readFileSync(credsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeUserCredentials(
  userId: string,
  credentials: {
    WXCLAW_TOKEN: string;
    WXCLAW_BASE_URL: string;
    WXCLAW_TO_USER: string;
    accountId: string;
    userId: string;
  }
): void {
  ensureUserDataDir(userId);
  const credsPath = getUserCredentialsPath(userId);
  fs.writeFileSync(credsPath, JSON.stringify(credentials, null, 2), "utf-8");
}
