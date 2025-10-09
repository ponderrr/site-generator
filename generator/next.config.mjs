/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  experimental: { mdxRs: true },
  pageExtensions: ["tsx", "ts", "jsx", "js", "mdx", "md"],
  images: {
    unoptimized: true
  }
};
export default nextConfig;

