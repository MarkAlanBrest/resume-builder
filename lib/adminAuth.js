import { getDb } from "./db";

export function getAdminPassword() {
  const row = getDb()
    .prepare(`SELECT value FROM admin_settings WHERE key = 'password'`)
    .get();
  return row?.value || "";
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

  getDb()
    .prepare(
      `
      INSERT INTO admin_settings (key, value)
      VALUES ('password', @password)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `
    )
    .run({ password: trimmed });

  return trimmed;
}
