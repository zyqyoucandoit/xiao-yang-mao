import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const siteUrl = String(process.env.CURRENT_SITE_URL || "").replace(/\/$/, "");
const cookie = process.env.CURRENT_SITE_COOKIE || "";
const output = process.argv[2] || "data/current-entries.json";
if (!siteUrl) throw new Error("请设置 CURRENT_SITE_URL，例如现有私有站点地址");
const response = await fetch(`${siteUrl}/api/entries?all=1`, { headers: cookie ? { Cookie: cookie } : {} });
if (!response.ok) throw new Error(`现有站点导出失败：HTTP ${response.status}`);
const payload = await response.json();
if (!Array.isArray(payload.entries)) throw new Error("导出响应不是有效入口列表");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(payload.entries, null, 2), "utf8");
console.log(`Exported ${payload.entries.length} entries to ${output}`);
