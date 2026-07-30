import { neon } from "@neondatabase/serverless";

let tableReady = false;

function getDatabaseUrl() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
}

function getSql() {
  const url = getDatabaseUrl();
  if (!url) return null;
  return neon(url);
}

export function hasPostgresStorage() {
  return !!getDatabaseUrl();
}

async function ensureTable() {
  if (tableReady || !hasPostgresStorage()) return;

  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS admin_data (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  tableReady = true;
}

function storageKey(filename) {
  return filename.replace(/\.json$/, "");
}

export async function readPostgresJson(filename) {
  if (!hasPostgresStorage()) return null;

  await ensureTable();
  const sql = getSql();
  const id = storageKey(filename);
  const rows = await sql`SELECT data FROM admin_data WHERE id = ${id}`;

  if (!rows.length) return null;
  return rows[0].data;
}

export async function writePostgresJson(filename, data) {
  if (!hasPostgresStorage()) {
    throw new Error("Postgres is not configured");
  }

  await ensureTable();
  const sql = getSql();
  const id = storageKey(filename);
  const payload = JSON.stringify(data);

  await sql`
    INSERT INTO admin_data (id, data, updated_at)
    VALUES (${id}, ${payload}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
  `;

  return data;
}

export async function getPostgresDiagnostics() {
  if (!hasPostgresStorage()) {
    return { postgresConnected: false, postgresHasData: false };
  }

  try {
    await ensureTable();
    const sql = getSql();
    const rows = await sql`SELECT COUNT(*)::int AS count FROM admin_data`;
    return {
      postgresConnected: true,
      postgresHasData: (rows[0]?.count || 0) > 0,
    };
  } catch {
    return { postgresConnected: false, postgresHasData: false };
  }
}
