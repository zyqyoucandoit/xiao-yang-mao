import { randomBytes } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";
import { hashPassword } from "../api/_lib/auth.js";

function hiddenPrompt(message) {
  return new Promise((resolve) => {
    output.write(message);
    input.setRawMode?.(true);
    input.resume();
    let value = "";
    const onData = (chunk) => {
      for (const character of String(chunk)) {
        if (character === "\u0003") process.exit(130);
        if (character === "\r" || character === "\n") {
          input.setRawMode?.(false);
          input.pause();
          input.off("data", onData);
          output.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u0008" || character === "\u007f") value = value.slice(0, -1);
        else if (character >= " ") value += character;
      }
    };
    input.on("data", onData);
  });
}

const password = await hiddenPrompt("管理密码（本地输入，不回显）：");
if (password.length < 12) throw new Error("管理密码至少需要 12 个字符");
console.log(`ADMIN_PASSWORD_HASH=${await hashPassword(password)}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
