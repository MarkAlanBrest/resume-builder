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

export async function readProgramDefaultsStore() {
  const stored = await readJsonFile(STORE_FILE, {});
  const store = defaultStore();

  for (const program of getAllPrograms()) {
    const entry = stored[program];
    if (!entry) continue;
    store[program] = serializeEntry(entry);
  }

  return store;
}

export async function getProgramDefaults(program) {
  const store = await readProgramDefaultsStore();
  return store[program] || emptyEntry();
}

export async function updateProgramDefaults(program, { skills, certifications }) {
  const store = await readProgramDefaultsStore();
  const updatedAt = new Date().toISOString();
  const payload = {
    skills: parseList(skills),
    certifications: parseList(certifications),
    updatedAt,
  };

  store[program] = payload;
  await writeJsonFile(STORE_FILE, store);

  return { ...payload };
}
