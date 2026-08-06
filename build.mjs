import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { categories, platforms } from "./platforms.js";

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
  for (const [pathname, filename, type] of textSources) textAssets[pathname] = { body: await readFile(join(root, filename), "utf8"), type };
  textAssets["/index.html"] = textAssets["/"];
  const binaryAssets = {};
  for (const [pathname, filename, type] of binarySources) binaryAssets[pathname] = { body: (await readFile(join(root, filename))).toString("base64"), type };
  const workerSource = (await readFile(join(root, "worker-template.js"), "utf8"))
    .replace("__TEXT_ASSETS__", JSON.stringify(textAssets))
    .replace("__BINARY_ASSETS__", JSON.stringify(binaryAssets))
    .replace("__SEED_ENTRIES__", JSON.stringify(platforms))
    .replace("__CATEGORY_IDS__", JSON.stringify(categories.map((category) => category.id)));
  await rm(dist, { recursive: true, force: true });
  await mkdir(join(dist, "server"), { recursive: true });
  await writeFile(join(dist, "server", "index.js"), workerSource, "utf8");
  console.log("Built dist/server/index.js");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
