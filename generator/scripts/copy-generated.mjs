import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("../AI generation/build/generated");
const DEST = path.resolve("content/pages");
fs.mkdirSync(DEST, { recursive: true });

if (!fs.existsSync(SRC)) {
  console.warn("⚠️  AI-generated content not found:", SRC);
  console.warn("⚠️  Skipping copy step. Run AI generation first or use existing content.");
  process.exit(0);
}

let copiedCount = 0;
for (const f of fs.readdirSync(SRC)) {
  if (f.toLowerCase().endsWith(".md")) {
    fs.copyFileSync(path.join(SRC, f), path.join(DEST, f.replace(/\.md$/i, ".mdx")));
    copiedCount++;
  }
}

if (copiedCount > 0) {
  console.log(`✓ Copied ${copiedCount} generated MD files -> content/pages as MDX`);
} else {
  console.warn("⚠️  No .md files found in AI generation directory");
}




