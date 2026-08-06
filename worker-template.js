const textAssets = __TEXT_ASSETS__;
const binaryAssets = __BINARY_ASSETS__;
const seedEntries = __SEED_ENTRIES__;
const validCategories = new Set(__CATEGORY_IDS__);
const DAY_MS = 24 * 60 * 60 * 1000;

function decodeBase64(value) {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return bytes;
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } });
}

function responseHeaders(pathname, type) {
  const headers = new Headers({ "Content-Type": type, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
  if (pathname.startsWith("/icons/")) headers.set("Cache-Control", "public, max-age=604800, immutable");
  else if (pathname === "/sw.js") {
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    headers.set("Service-Worker-Allowed", "/");
  } else headers.set("Cache-Control", "no-cache");
  if (pathname === "/" || pathname === "/index.html") {
    headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=()");
    headers.set("X-Frame-Options", "DENY");
  }
  return headers;
}

function isD1(db) { return Boolean(db && typeof db.prepare === "function"); }

function cleanText(value, maxLength, field, required = true) {
  const text = typeof value === "string" ? value.trim() : "";
  if (required && !text) throw new Error(`${field}不能为空`);
  if (text.length > maxLength) throw new Error(`${field}不能超过${maxLength}个字符`);
  return text;
}

function normalizeHttps(value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  let url;
  try { url = new URL(text); } catch { throw new Error("跳转链接必须是完整的 HTTPS 地址"); }
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("跳转链接只接受不含账号密码的 HTTPS 地址");
  return url.href;
}

function normalizeTips(value, category) {
  if (category === "shopping") return [];
  if (!Array.isArray(value)) return [];
  if (value.length > 8) throw new Error("省钱步骤最多 8 条");
  return value.map((item) => cleanText(item, 240, "省钱步骤")).filter(Boolean);
}

function normalizeAccent(value) {
  const accent = typeof value === "string" ? value.trim() : "";
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) throw new Error("卡片颜色必须是 6 位十六进制色值");
  return accent.toLowerCase();
}

function toEntry(row) {
  let tips = [];
  try { tips = JSON.parse(row.tips_json || "[]"); } catch {}
  return { id: row.id, category: row.category, name: row.name, monogram: row.monogram, description: row.description, href: row.href, appHref: row.app_href, code: row.code, actionLabel: row.action_label, accent: row.accent, tips: Array.isArray(tips) ? tips : [], notice: row.notice || "", enabled: Boolean(row.enabled), sortOrder: Number(row.sort_order), lastVerifiedAt: row.last_verified_at || null, createdAt: row.created_at, updatedAt: row.updated_at };
}

function fallbackEntries() { return seedEntries.map((entry, index) => ({ ...entry, enabled: true, sortOrder: index, lastVerifiedAt: null, createdAt: null, updatedAt: null })); }
function isStale(entry, now = Date.now()) { const timestamp = entry.lastVerifiedAt ? Date.parse(entry.lastVerifiedAt) : Number.NaN; return !Number.isFinite(timestamp) || now - timestamp > 30 * DAY_MS; }

async function ensureSeed(db) {
  const countRow = await db.prepare("SELECT COUNT(*) AS count FROM entries").first();
  if (Number(countRow?.count || 0) > 0) return;
  const now = new Date().toISOString();
  const statements = seedEntries.map((entry, index) => db.prepare("INSERT OR IGNORE INTO entries (id, category, name, monogram, description, href, app_href, code, action_label, accent, tips_json, notice, enabled, sort_order, last_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NULL, ?, ?)").bind(entry.id, entry.category, entry.name, entry.monogram || entry.name.slice(0, 1), entry.description, entry.href || null, entry.appHref || null, entry.code || null, entry.actionLabel, entry.accent, JSON.stringify(entry.tips || []), entry.notice || "", index, now, now));
  if (statements.length) await db.batch(statements);
}

async function getEntries(db, includeInactive) {
  const result = await db.prepare(includeInactive ? "SELECT * FROM entries ORDER BY category, sort_order, created_at" : "SELECT * FROM entries WHERE enabled = 1 ORDER BY category, sort_order, created_at").all();
  return (result.results || []).map(toEntry);
}

function validateEntry(payload, existing = null) {
  const category = cleanText(payload.category ?? existing?.category, 20, "分类");
  if (!validCategories.has(category)) throw new Error("分类不正确");
  const name = cleanText(payload.name ?? existing?.name, 50, "名称");
  const monogram = cleanText(payload.monogram ?? existing?.monogram ?? name.slice(0, 1), 3, "文字图标");
  const description = cleanText(payload.description ?? existing?.description, 160, "简介");
  const actionLabel = cleanText(payload.actionLabel ?? existing?.actionLabel, 48, "按钮文字");
  const accent = normalizeAccent(payload.accent ?? existing?.accent);
  const appHref = existing?.appHref || null;
  const code = existing?.code || null;
  const href = normalizeHttps(payload.href ?? existing?.href);
  if (!href && !appHref && !code) throw new Error("请填写有效的 HTTPS 跳转链接");
  const tips = normalizeTips(payload.tips ?? existing?.tips, category);
  const notice = category === "shopping" ? "" : cleanText(payload.notice ?? existing?.notice, 240, "提示", false);
  return { category, name, monogram, description, href, actionLabel, accent, tips, notice };
}

function writeAllowed(request) { const url = new URL(request.url); return request.headers.get("Origin") === url.origin; }
async function readPayload(request) { try { return await request.json(); } catch { throw new Error("请求内容不是有效 JSON"); } }
async function findEntry(db, id) { const row = await db.prepare("SELECT * FROM entries WHERE id = ?").bind(id).first(); return row ? toEntry(row) : null; }

async function api(request, env, pathname) {
  const db = env?.DB;
  const method = request.method;
  const includeInactive = new URL(request.url).searchParams.get("all") === "1";
  if (method === "GET" && pathname === "/api/entries") {
    if (!isD1(db)) return json({ entries: fallbackEntries(), staleCount: null, source: "fallback" });
    try { await ensureSeed(db); const entries = await getEntries(db, includeInactive); return json({ entries, staleCount: entries.filter((entry) => entry.enabled && isStale(entry)).length, source: "cloud" }); } catch { return json({ entries: fallbackEntries(), staleCount: null, source: "fallback" }); }
  }
  if (!isD1(db)) return json({ error: "云端管理暂不可用，请联网后重试。" }, 503);
  if (!writeAllowed(request)) return json({ error: "只接受同源管理请求。" }, 403);
  try {
    await ensureSeed(db);
    if (method === "POST" && pathname === "/api/entries") {
      const entry = validateEntry(await readPayload(request));
      const maximum = await db.prepare("SELECT MAX(sort_order) AS value FROM entries WHERE category = ?").bind(entry.category).first();
      const now = new Date().toISOString(); const id = crypto.randomUUID();
      await db.prepare("INSERT INTO entries (id, category, name, monogram, description, href, app_href, code, action_label, accent, tips_json, notice, enabled, sort_order, last_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, 1, ?, NULL, ?, ?)").bind(id, entry.category, entry.name, entry.monogram, entry.description, entry.href, entry.actionLabel, entry.accent, JSON.stringify(entry.tips), entry.notice, Number(maximum?.value || 0) + 1, now, now).run();
      return json({ entry: await findEntry(db, id) }, 201);
    }
    const match = pathname.match(/^\/api\/entries\/([^/]+)(?:\/(verify|toggle))?$/);
    if (!match) return json({ error: "未找到管理接口。" }, 404);
    const [, id, action] = match; const existing = await findEntry(db, id);
    if (!existing) return json({ error: "入口不存在。" }, 404);
    const now = new Date().toISOString();
    if (method === "POST" && action === "verify") { await db.prepare("UPDATE entries SET last_verified_at = ?, updated_at = ? WHERE id = ?").bind(now, now, id).run(); return json({ entry: await findEntry(db, id) }); }
    if (method === "POST" && action === "toggle") { await db.prepare("UPDATE entries SET enabled = ?, updated_at = ? WHERE id = ?").bind(existing.enabled ? 0 : 1, now, id).run(); return json({ entry: await findEntry(db, id) }); }
    if (method === "PATCH" && !action) {
      const entry = validateEntry(await readPayload(request), existing);
      await db.prepare("UPDATE entries SET category = ?, name = ?, monogram = ?, description = ?, href = ?, action_label = ?, accent = ?, tips_json = ?, notice = ?, updated_at = ? WHERE id = ?").bind(entry.category, entry.name, entry.monogram, entry.description, entry.href, entry.actionLabel, entry.accent, JSON.stringify(entry.tips), entry.notice, now, id).run();
      return json({ entry: await findEntry(db, id) });
    }
    return json({ error: "不支持的管理操作。" }, 405);
  } catch (error) { return json({ error: error instanceof Error ? error.message : "保存失败，请稍后重试。" }, 400); }
}

export default {
  async fetch(request, env = {}) {
    const pathname = new URL(request.url).pathname;
    if (pathname.startsWith("/api/")) return api(request, env, pathname);
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    const textAsset = textAssets[pathname];
    if (textAsset) return new Response(request.method === "HEAD" ? null : textAsset.body, { status: 200, headers: responseHeaders(pathname, textAsset.type) });
    const binaryAsset = binaryAssets[pathname];
    if (binaryAsset) return new Response(request.method === "HEAD" ? null : decodeBase64(binaryAsset.body), { status: 200, headers: responseHeaders(pathname, binaryAsset.type) });
    return new Response("页面不存在", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
  },
};
