import { fallbackEntries, getDatabase, listEntries, createEntry } from "../_lib/db.js";
import { isStale, normalizeEntry, parseQuery } from "../_lib/config.js";
import { isAuthenticated, requireAuth, requireSameOrigin } from "../_lib/auth.js";
import { readJson, methodNotAllowed, sendError, sendJson } from "../_lib/http.js";

export default async function handler(req, res) {
  const query = parseQuery(req);
  const includeInactive = query.get("all") === "1";
  if (req.method === "GET") {
    if (includeInactive && !requireAuth(req, res)) return;
    try {
      const sql = await getDatabase();
      if (!sql) return sendJson(res, { entries: fallbackEntries(), staleCount: null, source: "fallback" });
      const entries = await listEntries(sql, includeInactive && isAuthenticated(req));
      const staleCount = entries.filter((entry) => isStale(entry)).length;
      sendJson(res, { entries, staleCount, source: "cloud" }, 200, includeInactive ? {} : { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" });
    } catch {
      sendJson(res, { entries: fallbackEntries(), staleCount: null, source: "fallback" });
    }
    return;
  }
  if (req.method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);
  if (!requireAuth(req, res) || !requireSameOrigin(req, res)) return;
  try {
    const sql = await getDatabase();
    if (!sql) return sendError(res, "云端数据库尚未配置。", 503);
    const entry = normalizeEntry(await readJson(req));
    const created = await createEntry(sql, entry);
    sendJson(res, { entry: created }, 201);
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : "保存失败，请稍后重试。", 400);
  }
}
