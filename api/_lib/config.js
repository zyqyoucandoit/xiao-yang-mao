import { createHash } from "node:crypto";

export const VALID_CATEGORIES = new Set(["food", "local", "shopping"]);
export const DAY_MS = 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = "xiaoyangmao_session";
export const SESSION_MAX_AGE = 12 * 60 * 60;
export const LOGIN_LIMIT = 5;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;

export function databaseConfigured() {
  return typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.startsWith("postgres");
}

export function cleanText(value, maxLength, field, required = true) {
  const text = typeof value === "string" ? value.trim() : "";
  if (required && !text) throw new Error(`${field}不能为空`);
  if (text.length > maxLength) throw new Error(`${field}不能超过${maxLength}个字符`);
  return text;
}

export function normalizeHttps(value, allowEmpty = true) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text && allowEmpty) return null;
  let url;
  try { url = new URL(text); } catch { throw new Error("跳转链接必须是完整的 HTTPS 地址"); }
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("跳转链接只接受不含账号密码的 HTTPS 地址");
  return url.href;
}

export function normalizeAccent(value) {
  const accent = typeof value === "string" ? value.trim() : "";
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) throw new Error("卡片颜色必须是 6 位十六进制色值");
  return accent.toLowerCase();
}

export function normalizeTips(value, category) {
  if (category === "shopping") return [];
  if (!Array.isArray(value)) return [];
  if (value.length > 8) throw new Error("省钱步骤最多 8 条");
  return value.map((item) => cleanText(item, 240, "省钱步骤")).filter(Boolean);
}

export function normalizeEntry(payload = {}, existing = null) {
  const category = cleanText(payload.category ?? existing?.category, 20, "分类");
  if (!VALID_CATEGORIES.has(category)) throw new Error("分类不正确");
  const name = cleanText(payload.name ?? existing?.name, 50, "名称");
  const monogram = cleanText(payload.monogram ?? existing?.monogram ?? name.slice(0, 1), 3, "文字图标");
  const description = cleanText(payload.description ?? existing?.description, 160, "简介");
  const actionLabel = cleanText(payload.actionLabel ?? existing?.actionLabel, 48, "按钮文字");
  const accent = normalizeAccent(payload.accent ?? existing?.accent);
  const href = normalizeHttps(payload.href ?? existing?.href);
  const appHref = existing?.appHref || null;
  const code = existing?.code || null;
  if (!href && !appHref && !code) throw new Error("请填写有效的 HTTPS 跳转链接");
  const tips = normalizeTips(payload.tips ?? existing?.tips, category);
  const notice = category === "shopping" ? "" : cleanText(payload.notice ?? existing?.notice, 240, "提示", false);
  return { category, name, monogram, description, href, appHref, code, actionLabel, accent, tips, notice };
}

export function isStale(entry, now = Date.now()) {
  if (!entry.enabled) return false;
  const time = entry.lastVerifiedAt ? Date.parse(entry.lastVerifiedAt) : Number.NaN;
  return !Number.isFinite(time) || now - time > 30 * DAY_MS;
}

export function getRequestOrigin(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  return `${forwardedProto}://${forwardedHost}`;
}

export function writeAllowed(req) {
  const origin = req.headers.origin;
  return typeof origin === "string" && origin === getRequestOrigin(req);
}

export function clientFingerprint(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const address = forwarded || String(req.socket?.remoteAddress || "unknown");
  const agent = String(req.headers["user-agent"] || "unknown").slice(0, 160);
  return createHash("sha256").update(`${address}|${agent}`).digest("hex");
}

export function parseQuery(req) {
  const url = new URL(req.url || "/", getRequestOrigin(req));
  return url.searchParams;
}
