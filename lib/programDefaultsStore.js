import { getAllPrograms } from "./campuses";
import { defaultsForProgram } from "./seedProgramDefaults";
import {
  readAllProgramEntries,
  readProgramEntry,
  writeProgramEntry,
} from "./programStorage";

const STORE_ID = "program-defaults";

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

function defaultEntryForProgram(program) {
  const defaults = defaultsForProgram(program);
  return {
    skills: defaults.skills,
    certifications: defaults.certifications,
    updatedAt: null,
  };
}

export async function readProgramDefaultsStore() {
  const store = await readAllProgramEntries(STORE_ID, emptyEntry);
  const normalized = {};

  for (const program of getAllPrograms()) {
    const entry = store[program];
    normalized[program] = entry
      ? serializeEntry(entry)
      : serializeEntry(defaultEntryForProgram(program));
  }

  return normalized;
}

export async function getProgramDefaults(program) {
  const entry = await readProgramEntry(STORE_ID, program);
  if (!entry) return emptyEntry();
  return serializeEntry(entry);
}

export async function updateProgramDefaults(program, { skills, certifications }) {
  const updatedAt = new Date().toISOString();
  const payload = {
    skills: parseList(skills),
    certifications: parseList(certifications),
    updatedAt,
  };

  await writeProgramEntry(STORE_ID, program, payload);
  return { ...payload };
}
