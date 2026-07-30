import { readJsonFile, writeJsonFile } from "./jsonStore";

const SETTINGS_FILE = "settings.json";
export const DEFAULT_ADMIN_PASSWORD = "ncstadmin123";
export const DEFAULT_ADMIN_EMAIL = "admin@ncst.edu";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function defaultSettings() {
  return {
    admins: [{ email: DEFAULT_ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD }],
  };
}

function normalizeSettings(raw) {
  const settings = raw && typeof raw === "object" ? { ...raw } : {};

  if (Array.isArray(settings.admins) && settings.admins.length) {
    settings.admins = settings.admins.map((admin) => ({
      email: normalizeEmail(admin.email),
      password: String(admin.password || "").trim(),
    }));
    return settings;
  }

  const legacyPassword = String(settings.password || DEFAULT_ADMIN_PASSWORD).trim();
  return {
    admins: [{ email: DEFAULT_ADMIN_EMAIL, password: legacyPassword }],
  };
}

export async function getAdminSettings() {
  const stored = await readJsonFile(SETTINGS_FILE, defaultSettings());
  return normalizeSettings(stored);
}

export async function verifyAdminCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = String(password || "").trim();
  if (!normalizedEmail || !trimmedPassword) return false;

  const settings = await getAdminSettings();
  return settings.admins.some(
    (admin) =>
      admin.email === normalizedEmail && admin.password === trimmedPassword
  );
}

export async function updateAdminPassword(email, currentPassword, newPassword) {
  const normalizedEmail = normalizeEmail(email);
  const current = String(currentPassword || "").trim();
  const next = String(newPassword || "").trim();

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }
  if (!next) {
    throw new Error("New password cannot be empty");
  }
  if (next.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }
  if (!(await verifyAdminCredentials(normalizedEmail, current))) {
    throw new Error("Current password is incorrect");
  }

  const settings = await getAdminSettings();
  const admins = settings.admins.map((admin) =>
    admin.email === normalizedEmail ? { ...admin, password: next } : admin
  );

  await writeJsonFile(SETTINGS_FILE, { admins });
  return next;
}
