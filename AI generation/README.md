# AI Generation Pipeline

This pipeline combines Extractor + Analyzer outputs into an LLM-ready content pack and generates rewritten pages with Ollama (Llama 3.1).

## Inputs

- `../extractor/*.md` and `../extractor/*_metadata.json`
- `../analysis/*_analysis.json`, `*_metrics.json`, `*_classification.json`, `*_sections.json`, `summary.json`

## Outputs

- `build/pack/site.md` — single-file source pack
- `build/pack/pages/*.md` — per-page MD with YAML front matter
- `build/pack/site.jsonl` — 1 JSON object per page
- `build/pack/summary.md` — distilled site summary
- `build/generated/*.md` — rewritten pages (one per source page)

## Quick start

### Automatic Business Detection (Recommended)
```bash
cd "AI generation"
node scripts/auto-detect-business.mjs  # Auto-detects business info
python -m pip install -r requirements.txt
python packager/package_site.py
python drivers/generate_pages_ollama.py
```

### Manual Configuration
```bash
cd "AI generation"
# Edit config/site.config.yaml manually
python -m pip install -r requirements.txt
python packager/package_site.py
python drivers/generate_pages_ollama.py
```

## Config

See `config/site.config.yaml` for brand voice, CTAs, and per-page-type rules.

## Notes

- Works across most site types. Extend page-type taxonomy and cleaning rules in `package_site.py` as needed.
- For large sites, prefer per-page generation (default) over single huge prompt runs.
