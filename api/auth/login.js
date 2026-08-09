import { login, requireSameOrigin } from "../_lib/auth.js";
import { readJson, methodNotAllowed, sendError } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  if (!requireSameOrigin(req, res)) return;
  try {
    const payload = await readJson(req);
    const password = typeof payload.password === "string" ? payload.password : "";
    if (!password || password.length > 200) return sendError(res, "请输入管理密码。", 400);
    await login(req, res, password);
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : "登录失败，请稍后重试。", 400);
  }
}
