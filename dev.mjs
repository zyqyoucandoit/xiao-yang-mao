import http from "node:http";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { build } from "./build.mjs";

const root = new URL(".", import.meta.url);
const port = 4173;

await build();
const workerPath = pathToFileURL(join(fileURLToPath(root), "dist/server/index.js"));
const worker = (await import(`${workerPath.href}?v=${Date.now()}`)).default;

const server = http.createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url || "/", `http://${incoming.headers.host || `127.0.0.1:${port}`}`);
    const request = new Request(url, { method: incoming.method, headers: incoming.headers });
    const response = await worker.fetch(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    if (incoming.method === "HEAD") {
      outgoing.end();
      return;
    }
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    outgoing.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    outgoing.end("Preview server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local: http://127.0.0.1:${port}/`);
});
