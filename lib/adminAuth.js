import { readJsonFile, writeJsonFile } from "./jsonStore";

const SETTINGS_FILE = "settings.json";
export const DEFAULT_ADMIN_PASSWORD = "ncstadmin123";

function defaultSettings() {
  return { password: DEFAULT_ADMIN_PASSWORD };
}

export async function getAdminSettings() {
  return readJsonFile(SETTINGS_FILE, defaultSettings());
}

export async function getAdminPassword() {
  const settings = await getAdminSettings();
  return settings.password || DEFAULT_ADMIN_PASSWORD;
}

export async function verifyAdminPassword(password) {
  const expected = await getAdminPassword();
  return !!password && password === expected;
}

export async function updateAdminPassword(password) {
  const trimmed = String(password || "").trim();
  if (!trimmed) {
    throw new Error("Password cannot be empty");
  }

  await writeJsonFile(SETTINGS_FILE, { password: trimmed });
  return trimmed;
}
