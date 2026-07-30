import { readJsonFile, writeJsonFile } from "./jsonStore";

const SETTINGS_FILE = "settings.json";
export const DEFAULT_ADMIN_PIN = "ncstadmin123";

function defaultSettings() {
  return { password: DEFAULT_ADMIN_PIN };
}

function normalizeSettings(raw) {
  const settings = raw && typeof raw === "object" ? raw : {};

  if (typeof settings.password === "string" && settings.password.trim()) {
    return { password: settings.password.trim() };
  }

  if (Array.isArray(settings.admins) && settings.admins.length) {
    const firstPassword = String(settings.admins[0]?.password || "").trim();
    if (firstPassword) {
      return { password: firstPassword };
    }
  }

  return defaultSettings();
}

export async function getAdminSettings() {
  const stored = await readJsonFile(SETTINGS_FILE, defaultSettings());
  return normalizeSettings(stored);
}

export async function getAdminPin() {
  const settings = await getAdminSettings();
  return settings.password || DEFAULT_ADMIN_PIN;
}

export async function verifyAdminPin(pin) {
  const expected = await getAdminPin();
  const trimmed = String(pin || "").trim();
  return !!trimmed && trimmed === expected;
}

export async function updateAdminPin(currentPin, newPin) {
  const current = String(currentPin || "").trim();
  const next = String(newPin || "").trim();

  if (!next) {
    throw new Error("New PIN cannot be empty");
  }
  if (next.length < 8) {
    throw new Error("New PIN must be at least 8 characters");
  }
  if (!(await verifyAdminPin(current))) {
    throw new Error("Current PIN is incorrect");
  }

  await writeJsonFile(SETTINGS_FILE, { password: next });
  return next;
}
