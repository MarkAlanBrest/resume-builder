import { getAllPrograms } from "./campuses";
import {
  readAllProgramEntries,
  readProgramEntry,
  writeProgramEntry,
} from "./programStorage";

const STORE_ID = "course-of-study";

function emptyEntry() {
  return { text: "", updatedAt: null };
}

function normalizeEntry(entry) {
  return {
    text: entry?.text || "",
    updatedAt: entry?.updatedAt || null,
  };
}

export async function readCourseOfStudyStore() {
  const store = await readAllProgramEntries(STORE_ID, emptyEntry);
  const normalized = {};

  for (const program of getAllPrograms()) {
    normalized[program] = normalizeEntry(store[program]);
  }

  return normalized;
}

export async function getCourseOfStudy(program) {
  const entry = await readProgramEntry(STORE_ID, program);
  return normalizeEntry(entry || emptyEntry());
}

export async function updateProgramCourseOfStudy(program, text) {
  const updatedAt = new Date().toISOString();
  const entry = { text: String(text ?? ""), updatedAt };
  await writeProgramEntry(STORE_ID, program, entry);
  return entry;
}
