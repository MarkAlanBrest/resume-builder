import fs from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { getAllPrograms } from "./campuses";

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

function readBundledProgram(storeId, program) {
  const data = readFilesystemJson(
    path.join(BUNDLED_DATA_DIR, bundledFilename(storeId))
  );
  return data?.[program] ?? null;
}

function programBlobPath(storeId, program) {
  return `${BLOB_PREFIX}/${storeId}/programs/${encodeURIComponent(program)}.json`;
}

function legacyBlobPath(storeId) {
  return `${BLOB_PREFIX}/${bundledFilename(storeId)}`;
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

async function readLegacyBlobStore(storeId) {
  if (!hasBlobStorage()) return null;

  const result = await get(legacyBlobPath(storeId), {
    access: "private",
    useCache: false,
  });
  if (!result) return null;

  const text = await new Response(result.stream).text();
  return JSON.parse(text);
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

async function readBlobProgram(storeId, program) {
  if (!hasBlobStorage()) return null;

  const result = await get(programBlobPath(storeId, program), {
    access: "private",
    useCache: false,
  });
  if (!result) return null;

  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

async function writeBlobProgram(storeId, program, data) {
  await put(programBlobPath(storeId, program), JSON.stringify(data, null, 2), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

async function migrateLegacySources(storeId, program) {
  const legacyBlob = await readLegacyBlobStore(storeId);
  const legacyEntry = legacyBlob?.[program] ?? null;
  const bundledEntry = readBundledProgram(storeId, program);
  const entry = legacyEntry ?? bundledEntry;
  if (!entry) return null;

  if (hasPostgresStorage()) {
    await writePostgresProgram(storeId, program, entry);
  } else if (hasBlobStorage()) {
    await writeBlobProgram(storeId, program, entry);
  }

  return entry;
}

export async function readProgramEntry(storeId, program) {
  if (hasPostgresStorage()) {
    const row = await readPostgresProgram(storeId, program);
    if (row) return row;
    return migrateLegacySources(storeId, program);
  }

  if (hasBlobStorage()) {
    const blob = await readBlobProgram(storeId, program);
    if (blob) return blob;
    return migrateLegacySources(storeId, program);
  }

  return readBundledProgram(storeId, program);
}

export async function writeProgramEntry(storeId, program, data) {
  if (hasPostgresStorage()) {
    await writePostgresProgram(storeId, program, data);
    return data;
  }

  if (hasBlobStorage()) {
    await writeBlobProgram(storeId, program, data);
    return data;
  }

  const localDir = process.env.VERCEL
    ? path.join("/tmp", "resume-builder-data")
    : BUNDLED_DATA_DIR;
  const filePath = path.join(localDir, bundledFilename(storeId));
  const current =
    readFilesystemJson(filePath) ||
    readFilesystemJson(path.join(BUNDLED_DATA_DIR, bundledFilename(storeId))) ||
    {};
  current[program] = data;
  fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
  return data;
}

export async function readAllProgramEntries(storeId, defaultEntry) {
  const store = Object.fromEntries(
    getAllPrograms().map((program) => [program, defaultEntry()])
  );

  await Promise.all(
    getAllPrograms().map(async (program) => {
      const entry = await readProgramEntry(storeId, program);
      if (entry) store[program] = entry;
    })
  );

  return store;
}

export function getProgramStorageMode() {
  if (hasPostgresStorage()) return "postgres";
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
      const sample = getAllPrograms()[0];
      const entry = await readBlobProgram("course-of-study", sample);
      blobReadOk = true;
      blobHasData = entry !== null || (await readLegacyBlobStore("course-of-study")) !== null;
    } catch {
      blobReadOk = false;
    }
  }

  return {
    storage: getProgramStorageMode(),
    hasPostgresUrl: hasPostgresStorage(),
    ...postgres,
    hasBlobStoreId: !!process.env.BLOB_STORE_ID,
    blobReadOk,
    blobHasData,
    onVercel: !!process.env.VERCEL,
  };
}
