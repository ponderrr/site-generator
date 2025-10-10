import { execSync } from "node:child_process";

execSync("node scripts/generate-tokens.mjs", { stdio: "inherit" });
execSync("node scripts/copy-generated.mjs", { stdio: "inherit" });
execSync("node scripts/clean-mdx.mjs", { stdio: "inherit" });
execSync("node scripts/build-route-map.mjs", { stdio: "inherit" });
execSync("node scripts/inject-frontmatter.mjs", { stdio: "inherit" });


