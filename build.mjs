import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = resolve(root, "dist");

const textSources = [
  ["/", "index.html", "text/html; charset=utf-8"],
  ["/styles.css", "styles.css", "text/css; charset=utf-8"],
  ["/platforms.js", "platforms.js", "text/javascript; charset=utf-8"],
  ["/app.js", "app.js", "text/javascript; charset=utf-8"],
  ["/manifest.webmanifest", "manifest.webmanifest", "application/manifest+json; charset=utf-8"],
  ["/sw.js", "sw.js", "text/javascript; charset=utf-8"],
];

const binarySources = [
  ["/icons/icon-192.png", "public/icons/icon-192.png", "image/png"],
  ["/icons/icon-512.png", "public/icons/icon-512.png", "image/png"],
  ["/icons/icon-maskable-512.png", "public/icons/icon-maskable-512.png", "image/png"],
  ["/icons/apple-touch-icon.png", "public/icons/apple-touch-icon.png", "image/png"],
];

export async function build() {
  if (dirname(dist) !== root) throw new Error("Refusing to clean a dist path outside the project root.");

  const textAssets = {};
  for (const [pathname, filename, type] of textSources) {
    textAssets[pathname] = { body: await readFile(join(root, filename), "utf8"), type };
  }
  textAssets["/index.html"] = textAssets["/"];

  const binaryAssets = {};
  for (const [pathname, filename, type] of binarySources) {
    binaryAssets[pathname] = {
      body: (await readFile(join(root, filename))).toString("base64"),
      type,
    };
  }

  const workerSource = `
const textAssets = ${JSON.stringify(textAssets)};
const binaryAssets = ${JSON.stringify(binaryAssets)};

function decodeBase64(value) {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return bytes;
}

function responseHeaders(pathname, type) {
  const headers = new Headers({
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });

  if (pathname.startsWith("/icons/")) {
    headers.set("Cache-Control", "public, max-age=604800, immutable");
  } else if (pathname === "/sw.js") {
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    headers.set("Service-Worker-Allowed", "/");
  } else {
    headers.set("Cache-Control", "no-cache");
  }

  if (pathname === "/" || pathname === "/index.html") {
    headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=()");
    headers.set("X-Frame-Options", "DENY");
  }

  return headers;
}

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const pathname = new URL(request.url).pathname;
    const textAsset = textAssets[pathname];
    if (textAsset) {
      return new Response(request.method === "HEAD" ? null : textAsset.body, {
        status: 200,
        headers: responseHeaders(pathname, textAsset.type),
      });
    }

    const binaryAsset = binaryAssets[pathname];
    if (binaryAsset) {
      return new Response(request.method === "HEAD" ? null : decodeBase64(binaryAsset.body), {
        status: 200,
        headers: responseHeaders(pathname, binaryAsset.type),
      });
    }

    return new Response("页面不存在", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
    });
  },
};
`;

  await rm(dist, { recursive: true, force: true });
  await mkdir(join(dist, "server"), { recursive: true });
  await writeFile(join(dist, "server", "index.js"), workerSource.trimStart(), "utf8");
  console.log("Built dist/server/index.js");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
