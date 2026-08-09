import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDatabase } from "./db.js";
import { LOGIN_LIMIT, LOGIN_LOCK_MS, SESSION_COOKIE, SESSION_MAX_AGE, clientFingerprint, writeAllowed } from "./config.js";
import { sendError, sendJson } from "./http.js";

const scrypt = promisify(scryptCallback);

function base64Url(value) { return Buffer.from(value).toString("base64url"); }
function decodeBase64Url(value) { return Buffer.from(value, "base64url").toString("utf8"); }

export async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derived = await scrypt(String(password), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${Buffer.from(derived).toString("base64url")}`;
}

export async function verifyPassword(password, encoded) {
  if (typeof encoded !== "string" || !encoded.startsWith("scrypt$")) return false;
  const [, salt, expected] = encoded.split("$");
  if (!salt || !expected) return false;
  const derived = Buffer.from(await hashPassword(password, salt).then((value) => value.split("$")[2]), "base64url");
  const target = Buffer.from(expected, "base64url");
  return derived.length === target.length && timingSafeEqual(derived, target);
}

function sessionSecret() {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET 未配置");
  return process.env.SESSION_SECRET;
}

function sign(value) { return createHmac("sha256", sessionSecret()).update(value).digest("base64url"); }

export function createSessionValue(now = Date.now()) {
  const payload = base64Url(JSON.stringify({ exp: now + SESSION_MAX_AGE * 1000, nonce: randomBytes(12).toString("hex") }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionValue(value, now = Date.now()) {
  if (typeof value !== "string") return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const data = JSON.parse(decodeBase64Url(payload));
    return Number(data.exp) > now;
  } catch { return false; }
}

function parseCookies(req) {
  const raw = String(req.headers.cookie || "");
  return Object.fromEntries(raw.split(";").map((part) => part.trim().split("=")).filter(([key, value]) => key && value).map(([key, ...value]) => [key, value.join("=")]));
}

export function isAuthenticated(req) {
  try { return verifySessionValue(parseCookies(req)[SESSION_COOKIE]); } catch { return false; }
}

export function sessionCookie(value, maxAge = SESSION_MAX_AGE) {
  return `${SESSION_COOKIE}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie() { return sessionCookie("", 0); }

export function requireAuth(req, res) {
  if (isAuthenticated(req)) return true;
  sendError(res, "请先登录管理入口。", 401, { "WWW-Authenticate": "Cookie" });
  return false;
}

export function requireSameOrigin(req, res) {
  if (writeAllowed(req)) return true;
  sendError(res, "只接受同源管理请求。", 403);
  return false;
}

async function loginStatus(sql, fingerprint) {
  const rows = await sql`SELECT failures, locked_until FROM login_attempts WHERE fingerprint = ${fingerprint} LIMIT 1`;
  const row = rows[0];
  if (!row?.locked_until) return { locked: false };
  const lockedUntil = Date.parse(row.locked_until);
  if (Number.isFinite(lockedUntil) && lockedUntil > Date.now()) return { locked: true, retryAfter: Math.ceil((lockedUntil - Date.now()) / 1000) };
  return { locked: false };
}

async function recordFailure(sql, fingerprint) {
  const now = new Date().toISOString();
  const rows = await sql`SELECT failures FROM login_attempts WHERE fingerprint = ${fingerprint} LIMIT 1`;
  const failures = Number(rows[0]?.failures || 0) + 1;
  const lockedUntil = failures >= LOGIN_LIMIT ? new Date(Date.now() + LOGIN_LOCK_MS).toISOString() : null;
  await sql`
    INSERT INTO login_attempts (fingerprint, failures, locked_until, last_attempt_at)
    VALUES (${fingerprint}, ${failures}, ${lockedUntil}, ${now})
    ON CONFLICT (fingerprint) DO UPDATE SET failures = ${failures}, locked_until = ${lockedUntil}, last_attempt_at = ${now}
  `;
  return { failures, locked: Boolean(lockedUntil), retryAfter: lockedUntil ? Math.ceil(LOGIN_LOCK_MS / 1000) : 0 };
}

async function clearFailures(sql, fingerprint) {
  await sql`DELETE FROM login_attempts WHERE fingerprint = ${fingerprint}`;
}

export async function login(req, res, password) {
  const sql = await getDatabase();
  if (!sql) return sendError(res, "云端数据库尚未配置。", 503);
  const fingerprint = clientFingerprint(req);
  const status = await loginStatus(sql, fingerprint);
  if (status.locked) return sendError(res, `登录尝试过多，请 ${status.retryAfter} 秒后重试。`, 429, { "Retry-After": String(status.retryAfter) });
  const valid = await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
  if (!valid) {
    const failure = await recordFailure(sql, fingerprint);
    return sendError(res, failure.locked ? "登录失败次数过多，已暂时锁定。" : "管理密码不正确。", failure.locked ? 429 : 401, failure.locked ? { "Retry-After": String(failure.retryAfter) } : {});
  }
  await clearFailures(sql, fingerprint);
  if (!process.env.SESSION_SECRET) return sendError(res, "管理会话密钥尚未配置。", 503);
  sendJson(res, { authenticated: true }, 200, { "Set-Cookie": sessionCookie(createSessionValue()) });
}

export function sessionResponse(req, res) {
  sendJson(res, { authenticated: isAuthenticated(req) });
}

export function logout(res) {
  sendJson(res, { authenticated: false }, 200, { "Set-Cookie": clearSessionCookie() });
}
