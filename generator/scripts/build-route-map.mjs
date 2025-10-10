import fs from "node:fs";
import path from "node:path";

const SITE_JSONL = path.resolve("../AI generation/build/pack/site.jsonl");
const OUT = path.resolve("data/route-map.json");

// Check if AI-generated data exists
if (!fs.existsSync(SITE_JSONL)) {
  console.warn("⚠️  AI-generated site.jsonl not found");
  console.warn("⚠️  Creating minimal route map from content/pages directory");
  
  // Create minimal route map from existing MDX files
  const pagesDir = path.resolve("content/pages");
  const routes = [];
  
  if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
    for (const file of files) {
      const baseName = path.basename(file, path.extname(file));
      const slug = baseName === 'index' ? '/' : `/${baseName}`;
      routes.push({
        url: slug,
        slug: baseName,
        page_type: baseName === 'index' ? 'homepage' : 'other',
        file: file,
        title: baseName.charAt(0).toUpperCase() + baseName.slice(1)
      });
    }
  }
  
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ routes }, null, 2), "utf-8");
  console.log("✓ Created minimal route map:", OUT);
  process.exit(0);
}

const lines = fs.readFileSync(SITE_JSONL, "utf-8").split(/\r?\n/).filter(Boolean);
const records = lines.map((ln)=>JSON.parse(ln));
const routes = [];
const seen = new Set();

// Helper to generate clean URL from title and filename
function titleToUrl(title, filename) {
  if (!title) return "/";
  
  // Use filename to determine route if title is generic
  const baseName = filename.replace(/\.mdx?$/, '');
  
  // Check if this looks like a homepage (first file or home-related)
  if (baseName.includes('01-55-08') || title.toLowerCase().includes('home')) {
    return "/";
  }
  
  // Map specific patterns to clean URLs
  const lower = title.toLowerCase();
  if (lower.includes('about')) return '/about-us';
  if (lower.includes('contact')) return '/contact';
  if (lower.includes('portfolio') || lower.includes('our work') || lower.includes('gallery')) return '/portfolio';
  if (lower.includes('service')) return '/services';
  
  // Fallback: create clean URL from title
  const clean = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return clean === 'home' ? '/' : `/${clean}`;
}

// Helper to determine page type from title and URL
function guessPageType(title, url) {
  const lower = title.toLowerCase();
  if (url === '/' || lower.includes('home')) return 'homepage';
  if (lower.includes('service') || url === '/services') return 'service';
  if (lower.includes('contact') || url === '/contact') return 'contact';
  if (lower.includes('portfolio') || lower.includes('gallery') || url === '/portfolio') return 'other';
  if (lower.includes('about') || url === '/about-us') return 'other';
  return 'other';
}

for (const r of records) {
  // Use title and filename to generate URL
  const url = titleToUrl(r.title, r.id);
  
  // Skip duplicates (multiple home pages)
  if (seen.has(url)) continue;
  seen.add(url);
  
  const originalTitle = r.title || "";
  const page_type = guessPageType(originalTitle, url);
  const slug = url === "/" ? "index" : url.replace(/^\//,"");
  
  // Get actual filename from the original file path
  const originalFile = r.url || r.id || "";
  const baseName = path.basename(originalFile, '.md');
  const filename = baseName + ".mdx";
  
  // Generate proper title based on URL
  let title = originalTitle;
  if (url === '/') {
    // Homepage should use business name - will be handled by template
    title = "Home";
  } else if (url === '/services') {
    title = "Services";
  } else if (url === '/about-us') {
    title = "About Us";
  } else if (url === '/contact') {
    title = "Contact";
  } else if (url === '/portfolio') {
    title = "Portfolio";
  } else if (!originalTitle || originalTitle.includes('toulaslawnservicellc_com')) {
    // Generate clean title from URL
    title = slug.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  const route = { url, slug, page_type, file: filename, title };
  if (r.description) {
    route.description = r.description;
  }
  routes.push(route);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ routes }, null, 2), "utf-8");
console.log("Wrote", OUT);

