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
  await put(blobStorePath(storeId), json, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function readGithubStore(storeId) {
  if (!hasGithubStorage()) return null;
  return readGithubJson(bundledFilename(storeId));
}

async function readRuntimeStore(storeId) {
  if (hasPostgresStorage()) {
    await ensurePostgresTable();
    const sql = getSql();
    const rows = await sql`
      SELECT program, data FROM admin_program_data WHERE store_id = ${storeId}
    `;
    const store = {};
    for (const row of rows) {
      store[row.program] = row.data;
    }
    return Object.keys(store).length ? store : null;
  }

  if (hasGithubStorage()) {
    return readGithubStore(storeId);
  }

  if (hasBlobStorage()) {
    return readBlobStore(storeId);
  }

  if (process.env.VERCEL) {
    const filePath = path.join("/tmp", "resume-builder-data", bundledFilename(storeId));
    return readFilesystemJson(filePath);
  }

  return null;
}

async function writeRuntimeStore(storeId, data) {
  if (hasPostgresStorage()) {
    await ensurePostgresTable();
    for (const program of getAllPrograms()) {
      if (!data[program]) continue;
      await writePostgresProgram(storeId, program, data[program]);
    }
    return;
  }

  if (hasGithubStorage()) {
    await writeGithubJson(bundledFilename(storeId), data);
    return;
  }

  if (hasBlobStorage()) {
    await writeBlobStore(storeId, data);
    return;
  }

  const localDir = process.env.VERCEL
    ? path.join("/tmp", "resume-builder-data")
    : BUNDLED_DATA_DIR;
  const filePath = path.join(localDir, bundledFilename(storeId));
  fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function buildStore(storeId, runtime, bundled) {
  const store = { ...(bundled || {}) };

  if (runtime) {
    for (const [program, entry] of Object.entries(runtime)) {
      if (!entry || isEmptyEntry(storeId, entry)) continue;
      store[program] = entry;
    }
  }

  return store;
}

async function readStore(storeId) {
  const bundled = readBundledStore(storeId);
  const runtime = await readRuntimeStore(storeId);
  return buildStore(storeId, runtime, bundled);
}

export async function readProgramEntry(storeId, program) {
  const store = await readStore(storeId);
  return store[program] ?? readBundledProgram(storeId, program) ?? null;
}

export async function writeProgramEntry(storeId, program, data) {
  const store = await readStore(storeId);
  store[program] = data;
  await writeRuntimeStore(storeId, store);

  const readBack = await readProgramEntry(storeId, program);
  if (storeId === "course-of-study") {
    if ((readBack?.text || "") !== (data.text || "")) {
      throw new Error("Save did not persist. Please try again.");
    }
  } else if (storeId === "program-defaults") {
    const sameSkills =
      JSON.stringify(readBack?.skills || []) === JSON.stringify(data.skills || []);
    const sameCerts =
      JSON.stringify(readBack?.certifications || []) ===
      JSON.stringify(data.certifications || []);
    if (!sameSkills || !sameCerts) {
      throw new Error("Save did not persist. Please try again.");
    }
  }

  return data;
}

export async function readAllProgramEntries(storeId, defaultEntry) {
  const store = await readStore(storeId);
  const result = Object.fromEntries(
    getAllPrograms().map((program) => [program, defaultEntry()])
  );

  for (const program of getAllPrograms()) {
    if (store[program]) result[program] = store[program];
  }

  return result;
}

export async function reseedFromBundled() {
  const storeIds = ["course-of-study", "program-defaults"];
  let restored = 0;

  for (const storeId of storeIds) {
    const bundled = readBundledStore(storeId);
    if (!bundled) continue;
    await writeRuntimeStore(storeId, bundled);
    restored += getAllPrograms().filter((p) => bundled[p]).length;
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
