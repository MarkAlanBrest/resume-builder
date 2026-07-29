import fs from "fs";
import path from "path";
import { get, put } from "@vercel/blob";

const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");
const BLOB_PREFIX = "resume-builder-data";

function getRuntimeDataDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "resume-builder-data");
  }
  return BUNDLED_DATA_DIR;
}

function blobPath(filename) {
  return `${BLOB_PREFIX}/${filename}`;
}

function readFilesystemJson(filename) {
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

  return null;
}

export function getStorageMode() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.VERCEL) return "ephemeral";
  return "local";
}

export async function readJsonFile(filename, fallback) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const result = await get(blobPath(filename), {
        access: "private",
        useCache: false,
      });
      if (result?.statusCode === 200) {
        const text = await new Response(result.stream).text();
        return JSON.parse(text);
      }
    } catch {
      // Blob has not been created yet.
    }
  }

  const local = readFilesystemJson(filename);
  if (local !== null) return local;
  return fallback;
}

export async function writeJsonFile(filename, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(blobPath(filename), json, {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    });
    return data;
  }

  fs.mkdirSync(getRuntimeDataDir(), { recursive: true });
  fs.writeFileSync(path.join(getRuntimeDataDir(), filename), json, "utf8");
  return data;
}
