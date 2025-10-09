import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROUTE_MAP = JSON.parse(fs.readFileSync(path.resolve("data/route-map.json"), "utf-8"));
const CONF = fs.readFileSync(path.resolve("../AI generation/config/site.config.yaml"), "utf-8");

let brand = { name:"Your Brand", primary_cta:"Get a Free Quote", phone:"", email:"" };
try {
  const YAML = await import("yaml");
  const y = YAML.parse(CONF);
  brand = {
    name: y?.brand?.name || brand.name,
    primary_cta: y?.brand?.primary_cta || brand.primary_cta,
    phone: y?.constants?.phone || "",
    email: y?.constants?.email || ""
  };
} catch {}

const PAGES_DIR = path.resolve("content/pages");

for (const r of ROUTE_MAP.routes) {
  const fp = path.join(PAGES_DIR, r.file);
  if (!fs.existsSync(fp)) continue;
  const src = fs.readFileSync(fp, "utf-8");
  const fm = matter(src);
  const data = {
    title: r.title || fm.data.title || r.slug.split("/").pop(),
    slug: r.url,
    page_type: r.page_type,
    description: fm.data.description || "",
    brand: { cta: brand.primary_cta, phone: brand.phone, email: brand.email }
  };
  const out = matter.stringify(fm.content.trim(), data);
  fs.writeFileSync(fp, out, "utf-8");
}
console.log("Injected front matter into MDX pages");




