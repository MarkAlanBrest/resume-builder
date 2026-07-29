import { getDb } from "./db";
import { getAllPrograms } from "./campuses";

function emptyEntry() {
  return { text: "", updatedAt: null };
}

export function readCourseOfStudyStore() {
  const database = getDb();
  const rows = database
    .prepare(`SELECT program, text, updated_at AS updatedAt FROM course_of_study`)
    .all();

  const store = Object.fromEntries(
    getAllPrograms().map((program) => [program, emptyEntry()])
  );

  for (const row of rows) {
    store[row.program] = {
      text: row.text || "",
      updatedAt: row.updatedAt || null,
    };
  }

  return store;
}

export function updateProgramCourseOfStudy(program, text) {
  const updatedAt = new Date().toISOString();
  const trimmed = String(text || "").trim();

  getDb()
    .prepare(
      `
      INSERT INTO course_of_study (program, text, updated_at)
      VALUES (@program, @text, @updatedAt)
      ON CONFLICT(program) DO UPDATE SET
        text = excluded.text,
        updated_at = excluded.updated_at
    `
    )
    .run({ program, text: trimmed, updatedAt });

  return { text: trimmed, updatedAt };
}
