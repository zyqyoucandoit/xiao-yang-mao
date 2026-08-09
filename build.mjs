import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = resolve(root, "dist");
const textSources = ["index.html", "styles.css", "platforms.js", "app.js", "manifest.webmanifest", "sw.js"];
const binarySources = [
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
  "public/icons/icon-maskable-512.png",
  "public/icons/apple-touch-icon.png",
];

export async function build() {
  if (dirname(dist) !== root) throw new Error("Refusing to clean a dist path outside the project root.");
  await rm(dist, { recursive: true, force: true });
  await mkdir(join(dist, "icons"), { recursive: true });
  for (const source of textSources) await cp(join(root, source), join(dist, source));
  for (const source of binarySources) await cp(join(root, source), join(dist, source.replace("public/", "")));
  await writeFile(join(dist, ".vercel-output-ready"), "小羊毛静态资源构建完成\n", "utf8");
  console.log(`Built ${textSources.length + binarySources.length} static assets in dist/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
