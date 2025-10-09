import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("../AI generation/build/generated");
const DEST = path.resolve("content/pages");
fs.mkdirSync(DEST, { recursive: true });

if (!fs.existsSync(SRC)) {
  console.error("Source not found:", SRC);
  process.exit(1);
}
for (const f of fs.readdirSync(SRC)) {
  if (f.toLowerCase().endsWith(".md")) {
    fs.copyFileSync(path.join(SRC, f), path.join(DEST, f.replace(/\.md$/i, ".mdx")));
  }
}
console.log("Copied generated MD -> content/pages as MDX");




