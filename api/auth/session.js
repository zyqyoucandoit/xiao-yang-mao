import { sessionResponse } from "../_lib/auth.js";
import { methodNotAllowed } from "../_lib/http.js";

export default function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  sessionResponse(req, res);
}
