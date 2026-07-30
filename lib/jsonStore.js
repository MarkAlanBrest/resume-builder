import fs from "fs";
import path from "path";
import { list, put } from "@vercel/blob";
import {
  hasGithubStorage,
  readGithubJson,
  writeGithubJson,
} from "./githubStore";

const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");
const BLOB_PREFIX = "resume-builder-data";

function getLocalRuntimeDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "resume-builder-data");
  }
  return BUNDLED_DATA_DIR;
}

function blobPath(filename) {
  return `${BLOB_PREFIX}/${filename}`;
}

function hasBlobStorage() {
  return !!(
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_STORE_ID
  );
}

function readFilesystemJson(filePath) {
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

async function readBlobJson(filename) {
  if (!hasBlobStorage()) return null;

  try {
    const pathname = blobPath(filename);
    const { blobs } = await list({ prefix: pathname, limit: 1 });
    const blob = blobs.find((entry) => entry.pathname === pathname);
    if (!blob) return null;

    const response = await fetch(blob.downloadUrl);
    if (!response.ok) return null;
    return JSON.parse(await response.text());
  } catch {
    return null;
  }
}

async function readRuntimeJson(filename) {
  if (hasBlobStorage()) return readBlobJson(filename);
  if (hasGithubStorage()) return readGithubJson(filename);
  return readFilesystemJson(path.join(getLocalRuntimeDir(), filename));
}

export function getStorageMode() {
  if (hasBlobStorage()) return "blob";
  if (hasGithubStorage()) return "github";
  if (process.env.VERCEL) return "ephemeral";
  return "local";
}

export function getStorageDiagnostics() {
  return {
    storage: getStorageMode(),
    hasBlobStoreId: !!process.env.BLOB_STORE_ID,
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    hasGithubToken: !!process.env.GITHUB_TOKEN,
    onVercel: !!process.env.VERCEL,
  };
}

export async function readJsonFile(filename, fallback) {
  const bundled = readFilesystemJson(path.join(BUNDLED_DATA_DIR, filename));
  const runtime = await readRuntimeJson(filename);

  if (bundled === null && runtime === null) return fallback;
  if (bundled === null) return runtime;
  if (runtime === null) return bundled;

  const merged = mergeProgramStores(bundled, runtime);
  return merged ?? fallback;
}

export async function writeJsonFile(filename, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;

  if (hasBlobStorage()) {
    await put(blobPath(filename), json, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return data;
  }

  if (hasGithubStorage()) {
    return writeGithubJson(filename, data);
  }

  fs.mkdirSync(getLocalRuntimeDir(), { recursive: true });
  fs.writeFileSync(path.join(getLocalRuntimeDir(), filename), json, "utf8");
  return data;
}
