import { MDXRemote } from "next-mdx-remote/rsc";
import routeMap from "../data/route-map.json";
import tokensDefault from "@themes/default/tokens";
import fs from "node:fs";
import path from "node:path";
import remarkGfm from "remark-gfm";
import matter from "gray-matter";
import HomepageTemplate from "@themes/default/templates/homepage";

export default async function Index() {
  // Find the homepage entry
  const homepageEntry = (routeMap.routes as any[]).find((r) => r.url === "/");
  
  if (!homepageEntry) {
    return <div style={{ padding: 24 }}>Homepage not found in route-map.</div>;
  }

  const filePath = path.join(process.cwd(), "content", "pages", homepageEntry.file);
  if (!fs.existsSync(filePath)) {
    return <div style={{ padding: 24 }}>Homepage MDX file missing: {homepageEntry.file}</div>;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter, content } = matter(fileContent);
  
  // Use route-map data as primary source, frontmatter as fallback
  const meta = {
    title: homepageEntry.title || frontmatter.title,
    description: homepageEntry.description || frontmatter.description,
    page_type: homepageEntry.page_type || frontmatter.page_type
  };

  return (
    <HomepageTemplate 
      meta={meta} 
      tokens={tokensDefault}
    >
      <MDXRemote source={content} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
    </HomepageTemplate>
  );
}

