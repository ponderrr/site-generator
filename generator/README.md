# Generator (Phase 2)

Reads AI Generation outputs and builds a Next.js site with page-type templates.

## Inputs
- `../AI generation/build/generated/*.md`
- `../AI generation/build/pack/site.jsonl`
- `../AI generation/config/site.config.yaml`

## Commands
```bash
cd generator
pnpm install
# Prepare content & routes
node scripts/prebuild.mjs
# Dev server
pnpm dev
# Production build
pnpm build && pnpm start
# Validate internal links
pnpm validate:links
```

