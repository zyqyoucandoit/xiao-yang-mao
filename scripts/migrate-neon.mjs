import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("请先设置 DATABASE_URL");
const sql = neon(process.env.DATABASE_URL);
const migration = await readFile(new URL("../db/migrations/0001_neon.sql", import.meta.url), "utf8");
const statements = migration.split(/;\s*(?:\r?\n|$)/).map((item) => item.trim()).filter(Boolean);
await sql.transaction(statements.map((statement) => sql.unsafe(statement)));
console.log(`Neon migration applied: ${statements.length} statements`);
