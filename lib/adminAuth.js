import { readJsonFile, writeJsonFile } from "./jsonStore";

const SETTINGS_FILE = "settings.json";
export const DEFAULT_ADMIN_PASSWORD = "ncstadmin123";

function defaultSettings() {
  return { password: DEFAULT_ADMIN_PASSWORD };
}

export function getAdminSettings() {
  return readJsonFile(SETTINGS_FILE, defaultSettings());
}

export function getAdminPassword() {
  return getAdminSettings().password || DEFAULT_ADMIN_PASSWORD;
}

export function verifyAdminPassword(password) {
  const expected = getAdminPassword();
  return !!password && password === expected;
}

export function updateAdminPassword(password) {
  const trimmed = String(password || "").trim();
  if (!trimmed) {
    throw new Error("Password cannot be empty");
  }

  writeJsonFile(SETTINGS_FILE, { password: trimmed });
  return trimmed;
}
