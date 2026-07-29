import fs from "fs";
import path from "path";

const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");

function getRuntimeDataDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "resume-builder-data");
  }
  return BUNDLED_DATA_DIR;
}

function ensureRuntimeDir() {
  fs.mkdirSync(getRuntimeDataDir(), { recursive: true });
}

function readFileJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeProgramStores(bundled, runtime) {
  if (!isPlainObject(bundled) && !isPlainObject(runtime)) {
    return bundled ?? runtime ?? null;
  }

  const merged = { ...(bundled || {}) };

  for (const [key, runtimeEntry] of Object.entries(runtime || {})) {
    if (!isPlainObject(runtimeEntry)) {
      merged[key] = runtimeEntry;
      continue;
    }

    const bundledEntry = merged[key];
    const runtimeUpdatedAt = runtimeEntry.updatedAt || null;
    const bundledUpdatedAt = bundledEntry?.updatedAt || null;

    if (!runtimeUpdatedAt) continue;
    if (!bundledUpdatedAt || runtimeUpdatedAt > bundledUpdatedAt) {
      merged[key] = runtimeEntry;
    }
  }

  return merged;
}

export function readJsonFile(filename, fallback) {
  const bundled = readFileJson(path.join(BUNDLED_DATA_DIR, filename));
  const runtime = readFileJson(path.join(getRuntimeDataDir(), filename));

  if (bundled === null && runtime === null) return fallback;
  if (bundled === null) return runtime;
  if (runtime === null) return bundled;

  const merged = mergeProgramStores(bundled, runtime);
  return merged ?? fallback;
}

export function writeJsonFile(filename, data) {
  ensureRuntimeDir();
  const filePath = path.join(getRuntimeDataDir(), filename);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return data;
}
