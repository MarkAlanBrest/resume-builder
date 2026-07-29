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

export function readJsonFile(filename, fallback) {
  const candidates = [
    path.join(getRuntimeDataDir(), filename),
    path.join(BUNDLED_DATA_DIR, filename),
  ];

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      // Try the next location.
    }
  }

  return fallback;
}

export function writeJsonFile(filename, data) {
  ensureRuntimeDir();
  const filePath = path.join(getRuntimeDataDir(), filename);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return data;
}
