import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getAllPrograms } from "./campuses";
import { seedProgramDefaults } from "./programDefaultsStore";

const DB_PATH = path.join(process.cwd(), "data", "app.db");
const LEGACY_JSON_PATH = path.join(process.cwd(), "data", "course-of-study.json");
const DEFAULT_ADMIN_PASSWORD = "ncstadmin123";

let db;

function seedCourseOfStudy(database) {
  const insert = database.prepare(`
    INSERT OR IGNORE INTO course_of_study (program, text, updated_at)
    VALUES (@program, '', NULL)
  `);

  for (const program of getAllPrograms()) {
    insert.run({ program });
  }
}

function seedAdminPassword(database) {
  database
    .prepare(
      `
      INSERT OR IGNORE INTO admin_settings (key, value)
      VALUES ('password', @password)
    `
    )
    .run({ password: DEFAULT_ADMIN_PASSWORD });
}

export function getDb() {
  if (db) return db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_of_study (
      program TEXT PRIMARY KEY,
      text TEXT NOT NULL DEFAULT '',
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS program_defaults (
      program TEXT PRIMARY KEY,
      skills_json TEXT NOT NULL DEFAULT '[]',
      certifications_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT
    );
  `);

  seedAdminPassword(db);
  seedCourseOfStudy(db);
  seedProgramDefaults(db);
  migrateLegacyCourseOfStudyJson(db);

  return db;
}

function migrateLegacyCourseOfStudyJson(database) {
  if (!fs.existsSync(LEGACY_JSON_PATH)) return;

  try {
    const legacy = JSON.parse(fs.readFileSync(LEGACY_JSON_PATH, "utf8"));
    const update = database.prepare(`
      UPDATE course_of_study
      SET text = @text, updated_at = @updatedAt
      WHERE program = @program AND (text = '' OR text IS NULL)
    `);

    for (const [program, entry] of Object.entries(legacy)) {
      const text = entry?.text?.trim();
      if (!text) continue;
      update.run({
        program,
        text,
        updatedAt: entry?.updatedAt || new Date().toISOString(),
      });
    }
  } catch {
    // Ignore invalid legacy files.
  }
}
