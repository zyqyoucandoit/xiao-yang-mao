import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { platforms } from "../../platforms.js";
import { databaseConfigured } from "./config.js";

let sqlInstance = null;
let schemaPromise = null;

export function getSql() {
  if (!databaseConfigured()) return null;
  if (!sqlInstance) sqlInstance = neon(process.env.DATABASE_URL);
  return sqlInstance;
}

function parseTips(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return []; }
  }
  return [];
}

export function toEntry(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    monogram: row.monogram,
    description: row.description,
    href: row.href || null,
    appHref: row.app_href || null,
    code: row.code || null,
    actionLabel: row.action_label,
    accent: row.accent,
    tips: parseTips(row.tips_json),
    notice: row.notice || "",
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order || 0),
    lastVerifiedAt: row.last_verified_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

export function fallbackEntries() {
  return platforms.map((entry, index) => ({
    ...entry,
    enabled: true,
    sortOrder: index,
    lastVerifiedAt: null,
    createdAt: null,
    updatedAt: null,
  }));
}

async function ensureSchema(sql) {
  if (!schemaPromise) {
    schemaPromise = sql.transaction([
      sql`CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        monogram TEXT NOT NULL,
        description TEXT NOT NULL,
        href TEXT,
        app_href TEXT,
        code TEXT,
        action_label TEXT NOT NULL,
        accent TEXT NOT NULL,
        tips_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        notice TEXT NOT NULL DEFAULT '',
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        last_verified_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      sql`CREATE INDEX IF NOT EXISTS entries_category_enabled_sort_idx ON entries(category, enabled, sort_order)`,
      sql`CREATE INDEX IF NOT EXISTS entries_last_verified_at_idx ON entries(last_verified_at)`,
      sql`CREATE TABLE IF NOT EXISTS login_attempts (
        fingerprint TEXT PRIMARY KEY,
        failures INTEGER NOT NULL DEFAULT 0,
        locked_until TEXT,
        last_attempt_at TEXT NOT NULL
      )`,
    ]).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function getDatabase() {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema(sql);
  return sql;
}

export async function ensureSeed(sql) {
  const countRows = await sql`SELECT COUNT(*)::int AS count FROM entries`;
  if (Number(countRows[0]?.count || 0) > 0) return;
  const now = new Date().toISOString();
  const queries = platforms.map((entry, index) => sql`
    INSERT INTO entries (id, category, name, monogram, description, href, app_href, code, action_label, accent, tips_json, notice, enabled, sort_order, last_verified_at, created_at, updated_at)
    VALUES (${entry.id}, ${entry.category}, ${entry.name}, ${entry.monogram || entry.name.slice(0, 1)}, ${entry.description}, ${entry.href || null}, ${entry.appHref || null}, ${entry.code || null}, ${entry.actionLabel}, ${entry.accent}, ${JSON.stringify(entry.tips || [])}::jsonb, ${entry.notice || ""}, TRUE, ${index}, NULL, ${now}, ${now})
    ON CONFLICT (id) DO NOTHING
  `);
  await sql.transaction(queries);
}

export async function listEntries(sql, includeInactive = false) {
  await ensureSeed(sql);
  const rows = includeInactive
    ? await sql`SELECT * FROM entries ORDER BY category, sort_order, created_at`
    : await sql`SELECT * FROM entries WHERE enabled = TRUE ORDER BY category, sort_order, created_at`;
  return rows.map(toEntry);
}

export async function findEntry(sql, id) {
  await ensureSeed(sql);
  const rows = await sql`SELECT * FROM entries WHERE id = ${id} LIMIT 1`;
  return rows[0] ? toEntry(rows[0]) : null;
}

export async function createEntry(sql, entry) {
  const maxRows = await sql`SELECT COALESCE(MAX(sort_order), -1)::int AS value FROM entries WHERE category = ${entry.category}`;
  const id = randomUUID();
  const now = new Date().toISOString();
  await sql`
    INSERT INTO entries (id, category, name, monogram, description, href, app_href, code, action_label, accent, tips_json, notice, enabled, sort_order, last_verified_at, created_at, updated_at)
    VALUES (${id}, ${entry.category}, ${entry.name}, ${entry.monogram}, ${entry.description}, ${entry.href}, NULL, NULL, ${entry.actionLabel}, ${entry.accent}, ${JSON.stringify(entry.tips)}::jsonb, ${entry.notice}, TRUE, ${Number(maxRows[0]?.value || -1) + 1}, NULL, ${now}, ${now})
  `;
  return findEntry(sql, id);
}

export async function updateEntry(sql, id, entry) {
  const now = new Date().toISOString();
  await sql`
    UPDATE entries
    SET category = ${entry.category}, name = ${entry.name}, monogram = ${entry.monogram}, description = ${entry.description}, href = ${entry.href}, action_label = ${entry.actionLabel}, accent = ${entry.accent}, tips_json = ${JSON.stringify(entry.tips)}::jsonb, notice = ${entry.notice}, updated_at = ${now}
    WHERE id = ${id}
  `;
  return findEntry(sql, id);
}

export async function toggleEntry(sql, id, enabled) {
  const now = new Date().toISOString();
  await sql`UPDATE entries SET enabled = ${!enabled}, updated_at = ${now} WHERE id = ${id}`;
  return findEntry(sql, id);
}

export async function verifyEntry(sql, id) {
  const now = new Date().toISOString();
  await sql`UPDATE entries SET last_verified_at = ${now}, updated_at = ${now} WHERE id = ${id}`;
  return findEntry(sql, id);
}
