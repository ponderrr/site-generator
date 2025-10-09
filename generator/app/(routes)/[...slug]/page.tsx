import { MDXRemote } from "next-mdx-remote/rsc";
import routeMap from "../../../data/route-map.json";
import tokensDefault from "@themes/default/tokens";
import fs from "node:fs";
import path from "node:path";
import remarkGfm from "remark-gfm";
import matter from "gray-matter";

// Import all templates
import HomepageTemplate from "@themes/default/templates/homepage";
import ServiceTemplate from "@themes/default/templates/service";
import ProductTemplate from "@themes/default/templates/product";
import BlogTemplate from "@themes/default/templates/blog";
import ContactTemplate from "@themes/default/templates/contact";
import FAQTemplate from "@themes/default/templates/faq";
import LocationTemplate from "@themes/default/templates/location";
import LegalTemplate from "@themes/default/templates/legal";
import OtherTemplate from "@themes/default/templates/other";

type RouteEntry = {
  url: string;
  slug: string;
  page_type: string;
  file: string;
  title?: string;
  description?: string;
};

const TEMPLATES: Record<string, any> = {
  homepage: HomepageTemplate,
  service: ServiceTemplate,
  product: ProductTemplate,
  blog: BlogTemplate,
  contact: ContactTemplate,
  faq: FAQTemplate,
  location: LocationTemplate,
  legal: LegalTemplate,
  other: OtherTemplate
};

function pickTemplate(pageType: string) {
  return TEMPLATES[pageType] || OtherTemplate;
}

function getFileForUrl(slugSegments: string[]) {
  const url = "/" + (slugSegments?.join("/") || "");
  const entry = (routeMap.routes as RouteEntry[]).find((r) => r.url === url) ||
                (routeMap.routes as RouteEntry[]).find((r) => r.url === "/" && url === "/");
  return entry;
}

export function generateStaticParams() {
  return (routeMap.routes as RouteEntry[])
    .filter(r => r.url !== "/")
    .map((route) => ({
      slug: route.slug === "index" ? [] : route.slug.split("/")
    }));
}

export default async function Page({ params }: { params: { slug?: string[] } }) {
  const entry = getFileForUrl(params.slug || []);
  if (!entry) return <div style={{ padding: 24 }}>Not found in route-map.</div>;

  const filePath = path.join(process.cwd(), "content", "pages", entry.file);
  if (!fs.existsSync(filePath)) return <div style={{ padding: 24 }}>MDX file missing: {entry.file}</div>;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter, content } = matter(fileContent);
  
  // Use route-map data as primary source, frontmatter as fallback
  // This ensures contact page shows "Contact Us" instead of auto-generated filename
  const meta = {
    title: entry.title || frontmatter.title,
    description: entry.description || frontmatter.description,
    page_type: entry.page_type || frontmatter.page_type
  };
  
  const Template = pickTemplate(meta.page_type);

  return (
    <Template meta={meta} tokens={tokensDefault}>
      <MDXRemote source={content} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
    </Template>
  );
}

