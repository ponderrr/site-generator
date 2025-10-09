import fs from "node:fs";
import path from "node:path";

const SITE_JSONL = path.resolve("../AI generation/build/pack/site.jsonl");
const OUT = path.resolve("data/route-map.json");

const lines = fs.readFileSync(SITE_JSONL, "utf-8").split(/\r?\n/).filter(Boolean);
const records = lines.map((ln)=>JSON.parse(ln));
const routes = [];
const seen = new Set();

// Helper to generate clean URL from title
function titleToUrl(title) {
  if (!title) return "/";
  const clean = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return clean === 'northshore-exterior-upkeep' || clean === 'home' ? '/' : `/${clean}`;
}

// Helper to determine page type from title
function guessPageType(title, url) {
  const lower = title.toLowerCase();
  if (url === '/' || lower.includes('home')) return 'homepage';
  if (lower.includes('service')) return 'service';
  if (lower.includes('contact') || lower.includes('get in touch')) return 'contact';
  if (lower.includes('faq')) return 'faq';
  if (lower.includes('about')) return 'other';
  return 'other';
}

for (const r of records) {
  // Use title to generate URL instead of file path
  const url = titleToUrl(r.title);
  
  // Skip duplicates (multiple home pages)
  if (seen.has(url)) continue;
  seen.add(url);
  
  const title = r.title || "";
  const page_type = guessPageType(title, url);
  const slug = url === "/" ? "index" : url.replace(/^\//,"");
  
  // Get actual filename from the original file path
  const originalFile = r.url || r.id || "";
  const baseName = path.basename(originalFile, '.md');
  const filename = baseName + ".mdx";
  
  const route = { url, slug, page_type, file: filename, title };
  if (r.description) {
    route.description = r.description;
  }
  routes.push(route);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ routes }, null, 2), "utf-8");
console.log("Wrote", OUT);

