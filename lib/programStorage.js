import fs from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { getAllPrograms } from "./campuses";
import {
  hasGithubStorage,
  readGithubJson,
  writeGithubJson,
} from "./githubStore";

const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");
const BLOB_PREFIX = "resume-builder-data";

let postgresReady = false;

function getDatabaseUrl() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
}

function getSql() {
  const url = getDatabaseUrl();
  return url ? neon(url) : null;
}

export function hasPostgresStorage() {
  return !!getDatabaseUrl();
}

export function hasBlobStorage() {
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function readFilesystemJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function bundledFilename(storeId) {
  return `${storeId}.json`;
}

function blobStorePath(storeId) {
  return `${BLOB_PREFIX}/${bundledFilename(storeId)}`;
}

function readBundledStore(storeId) {
  return readFilesystemJson(
    path.join(BUNDLED_DATA_DIR, bundledFilename(storeId))
  );
}

function readBundledProgram(storeId, program) {
  const data = readBundledStore(storeId);
  return data?.[program] ?? null;
}

function isEmptyEntry(storeId, entry) {
  if (!entry) return true;
  if (storeId === "course-of-study") {
    return !String(entry.text || "").trim();
  }
  if (storeId === "program-defaults") {
    const hasSkills = Array.isArray(entry.skills) && entry.skills.length > 0;
    const hasCerts =
      Array.isArray(entry.certifications) && entry.certifications.length > 0;
    return !hasSkills && !hasCerts;
  }
  return false;
}

function pickBestEntry(storeId, bundled, runtime) {
  if (!runtime) return bundled;
  if (!bundled) return runtime;

  const runtimeEmpty = isEmptyEntry(storeId, runtime);
  const bundledEmpty = isEmptyEntry(storeId, bundled);
  if (runtimeEmpty && !bundledEmpty) return bundled;
  if (!runtimeEmpty && bundledEmpty) return runtime;

  const runtimeUpdatedAt = runtime.updatedAt || null;
  const bundledUpdatedAt = bundled.updatedAt || null;
  if (
    runtimeUpdatedAt &&
    (!bundledUpdatedAt || runtimeUpdatedAt >= bundledUpdatedAt)
  ) {
    return runtime;
  }
  return bundled;
}

async function ensurePostgresTable() {
  if (postgresReady || !hasPostgresStorage()) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS admin_program_data (
      store_id TEXT NOT NULL,
      program TEXT NOT NULL,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (store_id, program)
    )
  `;
  postgresReady = true;
}

async function readPostgresProgram(storeId, program) {
  if (!hasPostgresStorage()) return null;

  await ensurePostgresTable();
  const sql = getSql();
  const rows = await sql`
    SELECT data FROM admin_program_data
    WHERE store_id = ${storeId} AND program = ${program}
  `;
  if (!rows.length) return null;
  return rows[0].data;
}

async function writePostgresProgram(storeId, program, data) {
  await ensurePostgresTable();
  const sql = getSql();
  const payload = JSON.stringify(data);
  await sql`
    INSERT INTO admin_program_data (store_id, program, data, updated_at)
    VALUES (${storeId}, ${program}, ${payload}::jsonb, NOW())
    ON CONFLICT (store_id, program) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
  `;
}

async function readBlobStore(storeId) {
  if (!hasBlobStorage()) return null;

  const result = await get(blobStorePath(storeId), {
    access: "private",
    useCache: false,
  });
  if (!result) return null;

  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

async function writeBlobStore(storeId, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  const result = await put(blobStorePath(storeId), json, {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });

  const verify = await get(result.pathname || blobStorePath(storeId), {
    access: "private",
    useCache: false,
  });
  if (!verify) {
    throw new Error("Blob save could not be verified");
  }
}

async function readGithubProgram(storeId, program) {
  if (!hasGithubStorage()) return null;
  const store = await readGithubJson(bundledFilename(storeId));
  return store?.[program] ?? null;
}

async function readRuntimeProgram(storeId, program) {
  if (hasPostgresStorage()) {
    return readPostgresProgram(storeId, program);
  }

  if (hasGithubStorage()) {
    const github = await readGithubProgram(storeId, program);
    if (github) return github;
  }

  if (hasBlobStorage()) {
    const blobStore = await readBlobStore(storeId);
    return blobStore?.[program] ?? null;
  }

  return null;
}

async function readMergedStore(storeId) {
  const bundled = readBundledStore(storeId) || {};
  let runtime = {};

  if (hasPostgresStorage()) {
    await ensurePostgresTable();
    const sql = getSql();
    const rows = await sql`
      SELECT program, data FROM admin_program_data WHERE store_id = ${storeId}
    `;
    for (const row of rows) {
      runtime[row.program] = row.data;
    }
  } else {
    if (hasGithubStorage()) {
      runtime = (await readGithubJson(bundledFilename(storeId))) || {};
    } else if (hasBlobStorage()) {
      runtime = (await readBlobStore(storeId)) || {};
    }
  }

  const merged = { ...bundled };
  for (const program of getAllPrograms()) {
    const entry = pickBestEntry(storeId, bundled[program], runtime[program]);
    if (entry) merged[program] = entry;
  }
  return merged;
}

export async function readProgramEntry(storeId, program) {
  const bundled = readBundledProgram(storeId, program);
  const runtime = await readRuntimeProgram(storeId, program);
  return pickBestEntry(storeId, bundled, runtime);
}

export async function writeProgramEntry(storeId, program, data) {
  if (hasPostgresStorage()) {
    await writePostgresProgram(storeId, program, data);
    return data;
  }

  const merged = await readMergedStore(storeId);
  merged[program] = data;

  if (hasGithubStorage()) {
    await writeGithubJson(bundledFilename(storeId), merged);
    return data;
  }

  if (hasBlobStorage()) {
    await writeBlobStore(storeId, merged);
    return data;
  }

  const localDir = process.env.VERCEL
    ? path.join("/tmp", "resume-builder-data")
    : BUNDLED_DATA_DIR;
  const filePath = path.join(localDir, bundledFilename(storeId));
  fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  return data;
}

export async function readAllProgramEntries(storeId, defaultEntry) {
  const merged = await readMergedStore(storeId);
  const store = Object.fromEntries(
    getAllPrograms().map((program) => [program, defaultEntry()])
  );

  for (const program of getAllPrograms()) {
    const entry = merged[program];
    if (entry) store[program] = entry;
  }

  return store;
}

export async function reseedFromBundled() {
  const storeIds = ["course-of-study", "program-defaults"];
  let restored = 0;

  for (const storeId of storeIds) {
    const bundled = readBundledStore(storeId);
    if (!bundled) continue;

    if (hasGithubStorage()) {
      await writeGithubJson(bundledFilename(storeId), bundled);
      restored += getAllPrograms().filter((p) => bundled[p]).length;
      continue;
    }

    if (hasBlobStorage()) {
      await writeBlobStore(storeId, bundled);
      restored += getAllPrograms().filter((p) => bundled[p]).length;
      continue;
    }

    for (const program of getAllPrograms()) {
      const entry = bundled[program];
      if (!entry || isEmptyEntry(storeId, entry)) continue;
      await writeProgramEntry(storeId, program, entry);
      restored += 1;
    }
  }

  return { restored };
}

export function getProgramStorageMode() {
  if (hasPostgresStorage()) return "postgres";
  if (hasGithubStorage()) return "github";
  if (hasBlobStorage()) return "blob";
  if (process.env.VERCEL) return "ephemeral";
  return "local";
}

export async function getProgramStorageDiagnostics() {
  const postgres = { postgresConnected: false, postgresHasData: false };
  if (hasPostgresStorage()) {
    try {
      await ensurePostgresTable();
      const sql = getSql();
      const rows =
        await sql`SELECT COUNT(*)::int AS count FROM admin_program_data`;
      postgres.postgresConnected = true;
      postgres.postgresHasData = (rows[0]?.count || 0) > 0;
    } catch {
      postgres.postgresConnected = false;
    }
  }

  let blobReadOk = false;
  let blobHasData = false;
  if (hasBlobStorage()) {
    try {
      const store = await readBlobStore("course-of-study");
      blobReadOk = true;
      blobHasData = store !== null && Object.keys(store).length > 0;
    } catch {
      blobReadOk = false;
    }
  }

  return {
    storage: getProgramStorageMode(),
    hasPostgresUrl: hasPostgresStorage(),
    hasGithubToken: !!process.env.GITHUB_TOKEN,
    ...postgres,
    hasBlobStoreId: !!process.env.BLOB_STORE_ID,
    blobReadOk,
    blobHasData,
    onVercel: !!process.env.VERCEL,
  };
}
