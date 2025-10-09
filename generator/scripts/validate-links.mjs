import fs from "node:fs";
import path from "node:path";

const ROUTE_MAP = JSON.parse(fs.readFileSync(path.resolve("data/route-map.json"), "utf-8"));
const routes = new Set(ROUTE_MAP.routes.map(r => r.url));
const PAGES_DIR = path.resolve("content/pages");

const mdxFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith(".mdx"));
const broken = [];

const linkRe = /\]\((\/[a-zA-Z0-9_\-\/]*)\)/g;

for (const f of mdxFiles) {
  const text = fs.readFileSync(path.join(PAGES_DIR, f), "utf-8");
  let m;
  while ((m = linkRe.exec(text))) {
    const url = m[1];
    if (!routes.has(url)) broken.push({ file: f, url });
  }
}

if (broken.length) {
  console.error("Broken internal links found:");
  for (const b of broken) console.error(` - ${b.file} -> ${b.url}`);
  process.exit(2);
} else {
  console.log("No broken internal links ✅");
}




