import fs from "fs";
import path from "path";
import { getAllPrograms } from "./campuses";

const DATA_FILE = path.join(process.cwd(), "data", "course-of-study.json");

function defaultStore() {
  return Object.fromEntries(
    getAllPrograms().map((program) => [program, { text: "", updatedAt: null }])
  );
}

export function readCourseOfStudyStore() {
  const defaults = defaultStore();

  try {
    if (!fs.existsSync(DATA_FILE)) {
      writeCourseOfStudyStore(defaults);
      return defaults;
    }

    const stored = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { ...defaults, ...stored };
  } catch {
    return defaults;
  }
}

export function writeCourseOfStudyStore(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function updateProgramCourseOfStudy(program, text) {
  const store = readCourseOfStudyStore();
  store[program] = {
    text: String(text || "").trim(),
    updatedAt: new Date().toISOString(),
  };
  writeCourseOfStudyStore(store);
  return store[program];
}
