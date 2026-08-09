import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { cleanText, normalizeAccent, normalizeHttps, normalizeTips, VALID_CATEGORIES } from "../api/_lib/config.js";

if (!process.env.DATABASE_URL) throw new Error("请先设置 DATABASE_URL");
const source = process.argv[2] || "data/current-entries.json";
const records = JSON.parse(await readFile(source, "utf8"));
if (!Array.isArray(records)) throw new Error("导入文件必须是入口数组");
const sql = neon(process.env.DATABASE_URL);
const now = new Date().toISOString();
const queries = records.map((item, index) => {
  if (!item?.id || !VALID_CATEGORIES.has(item.category)) throw new Error(`入口 ${item?.id || "unknown"} 的分类不正确`);
  const name = cleanText(item.name, 50, "名称");
  const href = normalizeHttps(item.href);
  const appHref = typeof item.appHref === "string" ? item.appHref : null;
  const code = typeof item.code === "string" ? item.code : null;
  if (!href && !appHref && !code) throw new Error(`入口 ${item.id} 缺少有效链接或高级入口`);
  const tips = normalizeTips(item.tips, item.category);
  return sql`
    INSERT INTO entries (id, category, name, monogram, description, href, app_href, code, action_label, accent, tips_json, notice, enabled, sort_order, last_verified_at, created_at, updated_at)
    VALUES (${item.id}, ${item.category}, ${name}, ${cleanText(item.monogram || name.slice(0, 1), 3, "文字图标")}, ${cleanText(item.description, 160, "简介")}, ${href}, ${appHref}, ${code}, ${cleanText(item.actionLabel, 48, "按钮文字")}, ${normalizeAccent(item.accent)}, ${JSON.stringify(tips)}::jsonb, ${item.category === "shopping" ? "" : String(item.notice || "").slice(0, 240)}, ${item.enabled !== false}, ${Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index}, ${item.lastVerifiedAt || null}, ${item.createdAt || now}, ${item.updatedAt || now})
    ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category, name = EXCLUDED.name, monogram = EXCLUDED.monogram, description = EXCLUDED.description, href = EXCLUDED.href, app_href = EXCLUDED.app_href, code = EXCLUDED.code, action_label = EXCLUDED.action_label, accent = EXCLUDED.accent, tips_json = EXCLUDED.tips_json, notice = EXCLUDED.notice, enabled = EXCLUDED.enabled, sort_order = EXCLUDED.sort_order, last_verified_at = EXCLUDED.last_verified_at, updated_at = EXCLUDED.updated_at
  `;
});
await sql.transaction(queries);
console.log(`Imported ${records.length} entries into Neon`);
