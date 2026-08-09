import { logout, requireSameOrigin } from "../_lib/auth.js";
import { methodNotAllowed } from "../_lib/http.js";

export default function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  if (!requireSameOrigin(req, res)) return;
  logout(res);
}
