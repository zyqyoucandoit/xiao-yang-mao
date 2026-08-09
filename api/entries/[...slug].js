import { getDatabase, findEntry, updateEntry, toggleEntry, verifyEntry } from "../_lib/db.js";
import { normalizeEntry as validateEntry } from "../_lib/config.js";
import { requireAuth, requireSameOrigin } from "../_lib/auth.js";
import { readJson, methodNotAllowed, sendError, sendJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res) || !requireSameOrigin(req, res)) return;
  const slug = Array.isArray(req.query?.slug) ? req.query.slug : String(req.query?.slug || "").split("/").filter(Boolean);
  const id = slug[0];
  const action = slug[1] || null;
  if (!id || slug.length > 2) return sendError(res, "入口不存在。", 404);
  if (!["PATCH", "POST"].includes(req.method)) return methodNotAllowed(res, ["PATCH", "POST"]);
  try {
    const sql = await getDatabase();
    if (!sql) return sendError(res, "云端数据库尚未配置。", 503);
    const existing = await findEntry(sql, id);
    if (!existing) return sendError(res, "入口不存在。", 404);
    if (req.method === "POST" && action === "verify") return sendJson(res, { entry: await verifyEntry(sql, id) });
    if (req.method === "POST" && action === "toggle") return sendJson(res, { entry: await toggleEntry(sql, id, existing.enabled) });
    if (req.method === "PATCH" && !action) {
      const updated = await updateEntry(sql, id, validateEntry(await readJson(req), existing));
      return sendJson(res, { entry: updated });
    }
    sendError(res, "不支持的管理操作。", 405);
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : "保存失败，请稍后重试。", 400);
  }
}
