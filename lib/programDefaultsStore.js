import { getAllPrograms } from "./campuses";
import { defaultsForProgram } from "./seedProgramDefaults";
import { readJsonFile, writeJsonFile } from "./jsonStore";

const STORE_FILE = "program-defaults.json";

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

function defaultStore() {
  return Object.fromEntries(
    getAllPrograms().map((program) => {
      const defaults = defaultsForProgram(program);
      return [
        program,
        {
          skills: defaults.skills,
          certifications: defaults.certifications,
          updatedAt: null,
        },
      ];
    })
  );
}

export function readProgramDefaultsStore() {
  const stored = readJsonFile(STORE_FILE, {});
  const store = defaultStore();

  for (const program of getAllPrograms()) {
    const entry = stored[program];
    if (!entry) continue;
    store[program] = serializeEntry(entry);
  }

  return store;
}

export function getProgramDefaults(program) {
  const store = readProgramDefaultsStore();
  return store[program] || emptyEntry();
}

export function updateProgramDefaults(program, { skills, certifications }) {
  const store = readProgramDefaultsStore();
  const updatedAt = new Date().toISOString();
  const payload = {
    skills: parseList(skills),
    certifications: parseList(certifications),
    updatedAt,
  };

  store[program] = payload;
  writeJsonFile(STORE_FILE, store);

  return { ...payload };
}
