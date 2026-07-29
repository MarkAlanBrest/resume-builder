import { getAllPrograms } from "./campuses";
import { readJsonFile, writeJsonFile } from "./jsonStore";

const STORE_FILE = "course-of-study.json";

function emptyEntry() {
  return { text: "", updatedAt: null };
}

function defaultStore() {
  return Object.fromEntries(
    getAllPrograms().map((program) => [program, emptyEntry()])
  );
}

export function readCourseOfStudyStore() {
  const stored = readJsonFile(STORE_FILE, {});
  const store = defaultStore();

  for (const program of getAllPrograms()) {
    const entry = stored[program];
    if (!entry) continue;
    store[program] = {
      text: entry.text || "",
      updatedAt: entry.updatedAt || null,
    };
  }

  return store;
}

export function updateProgramCourseOfStudy(program, text) {
  const store = readCourseOfStudyStore();
  const updatedAt = new Date().toISOString();
  const trimmed = String(text || "").trim();

  store[program] = { text: trimmed, updatedAt };
  writeJsonFile(STORE_FILE, store);

  return { text: trimmed, updatedAt };
}
