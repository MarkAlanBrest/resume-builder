import { getDb } from "./db";
import { getAllPrograms } from "./campuses";
import { defaultsForProgram } from "./seedProgramDefaults";

function emptyEntry() {
  return { skills: [], certifications: [], updatedAt: null };
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return [];
}

function serializeEntry(entry) {
  return {
    skills: parseList(entry?.skills),
    certifications: parseList(entry?.certifications),
    updatedAt: entry?.updatedAt || null,
  };
}

export function readProgramDefaultsStore() {
  const database = getDb();
  const rows = database
    .prepare(
      `
      SELECT program, skills_json, certifications_json, updated_at AS updatedAt
      FROM program_defaults
    `
    )
    .all();

  const store = Object.fromEntries(
    getAllPrograms().map((program) => [program, emptyEntry()])
  );

  for (const row of rows) {
    store[row.program] = serializeEntry({
      skills: JSON.parse(row.skills_json || "[]"),
      certifications: JSON.parse(row.certifications_json || "[]"),
      updatedAt: row.updatedAt,
    });
  }

  return store;
}

export function getProgramDefaults(program) {
  const store = readProgramDefaultsStore();
  return store[program] || emptyEntry();
}

export function updateProgramDefaults(program, { skills, certifications }) {
  const updatedAt = new Date().toISOString();
  const payload = {
    skills: parseList(skills),
    certifications: parseList(certifications),
  };

  getDb()
    .prepare(
      `
      INSERT INTO program_defaults (program, skills_json, certifications_json, updated_at)
      VALUES (@program, @skillsJson, @certificationsJson, @updatedAt)
      ON CONFLICT(program) DO UPDATE SET
        skills_json = excluded.skills_json,
        certifications_json = excluded.certifications_json,
        updated_at = excluded.updated_at
    `
    )
    .run({
      program,
      skillsJson: JSON.stringify(payload.skills),
      certificationsJson: JSON.stringify(payload.certifications),
      updatedAt,
    });

  return { ...payload, updatedAt };
}

export function seedProgramDefaults(database) {
  const insert = database.prepare(`
    INSERT OR IGNORE INTO program_defaults (program, skills_json, certifications_json, updated_at)
    VALUES (@program, @skillsJson, @certificationsJson, NULL)
  `);

  for (const program of getAllPrograms()) {
    const defaults = defaultsForProgram(program);
    insert.run({
      program,
      skillsJson: JSON.stringify(defaults.skills),
      certificationsJson: JSON.stringify(defaults.certifications),
    });
  }
}
