import json, re, sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List
import yaml

# Fix Windows console encoding for emoji/unicode
if sys.platform == 'win32':
    import codecs
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
EXTRACTOR_DIR = (ROOT.parent / "extracted").resolve()
ANALYSIS_DIR = (ROOT.parent / "analysis").resolve()
OUT_DIR = (ROOT / "build" / "pack").resolve()
OUT_PAGES = OUT_DIR / "pages"
OUT_PAGES.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

def stem_id(p: Path) -> str:
    return p.name.rsplit(".", 1)[0]

def load_json(p: Path) -> dict:
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}

def guess_title_from_md(md: str) -> str:
    for pat in (r"^#\s+(.+)$", r"^##\s+(.+)$"):
        m = re.search(pat, md, re.M)
        if m: return m.group(1).strip()
    return ""

def clean_md(md: str) -> str:
    # minimal cleaning; extend if needed
    md = re.sub(r"\n{3,}", "\n\n", md)
    return md.strip()

def build_record(stem: str,
                 md_path: Path,
                 meta_path: Path,
                 analysis_paths: Dict[str, Path]) -> Dict[str, Any]:
    md = clean_md(md_path.read_text(encoding="utf-8"))
    meta = load_json(meta_path) if meta_path and meta_path.exists() else {}
    analysis = load_json(analysis_paths.get("analysis", Path()))
    metrics  = load_json(analysis_paths.get("metrics", Path()))
    classify = load_json(analysis_paths.get("classification", Path()))
    sections = load_json(analysis_paths.get("sections", Path()))

    url = meta.get("url") or analysis.get("url") or ""
    title = meta.get("title") or analysis.get("title") or guess_title_from_md(md) or stem
    page_type = (classify.get("page_type")
                 or analysis.get("page_type")
                 or "other")

    scores = {
        "quality": metrics.get("quality") or analysis.get("quality_score"),
        "readability": metrics.get("readability") or analysis.get("readability"),
        "seo": metrics.get("seo") or analysis.get("seo_score"),
    }

    # Handle sections - could be a list directly or a dict with sections key
    if isinstance(sections, list):
        sec_list = sections
        structure = analysis.get("structure") or []
    elif isinstance(sections, dict):
        structure = sections.get("structure") or analysis.get("structure") or []
        sec_list = sections.get("sections") or analysis.get("sections") or []
    else:
        structure = analysis.get("structure") or []
        sec_list = analysis.get("sections") or []
    
    sec_norm: List[Dict[str, str]] = []
    for s in sec_list:
        if isinstance(s, dict):
            # Handle different section formats
            label = s.get("label") or s.get("name") or s.get("type") or "section"
            text = s.get("text") or s.get("content") or ""
            sec_norm.append({"label": label, "text": text})
        elif isinstance(s, str):
            sec_norm.append({"label": "section", "text": s})

    recs = analysis.get("recommendations") or []
    if isinstance(recs, dict):
        recs = [f"{k}: {v}" for k, v in recs.items()]

    return {
        "id": stem,
        "url": url,
        "title": title,
        "page_type": page_type,
        "scores": scores,
        "readability": {"flesch": metrics.get("flesch") or analysis.get("flesch_score")},
        "structure": structure,
        "images": meta.get("images", []),
        "links": meta.get("links", []),
        "word_count": meta.get("word_count"),
        "reading_time_minutes": meta.get("reading_time_minutes"),
        "sections": sec_norm,
        "raw_markdown": md,
        "recommendations": recs,
        "related_pages": analysis.get("related_pages") or [],
    }

def write_page_md(rec: Dict[str, Any]):
    front = {
        "id": rec["id"],
        "url": rec["url"],
        "title": rec["title"],
        "page_type": rec["page_type"],
        "scores": rec["scores"],
        "images": rec["images"],
        "links": rec["links"],
        "structure": rec["structure"],
        "word_count": rec["word_count"],
        "reading_time_minutes": rec["reading_time_minutes"],
        "recommendations": rec["recommendations"],
    }
    fm = "---\n" + yaml.safe_dump(front, sort_keys=False, allow_unicode=True) + "---\n\n"
    body = ["## Source Content", rec["raw_markdown"], ""]
    if rec["sections"]:
        body.append("## Suggested Sections")
        for s in rec["sections"]:
            body.append(f"### {s['label'].title()}\n{s['text']}\n")
    (OUT_PAGES / f"{rec['id']}.md").write_text(fm + "\n".join(body), encoding="utf-8")

def write_site_md(records, summary_path: Path):
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    header = [f"# Site Content Pack", f"_Generated: {now}_", ""]
    if summary_path.exists():
        summary = load_json(summary_path)
        header += [
            "## Site Summary",
            f"- Pages: {summary.get('pages', len(records))}",
            f"- Avg Quality: {summary.get('avg_quality','?')}",
            f"- Notes: {summary.get('notes','')}",
            ""
        ]
        # Also produce a summary.md
        (OUT_DIR / "summary.md").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    blocks = []
    for r in records:
        blocks.append("\n".join([
            "---PAGE---",
            f"## [{r['title']}]({r['url']})",
            f"**Type:** {r['page_type']}  |  **Quality:** {r['scores'].get('quality')}  |  **SEO:** {r['scores'].get('seo')}",
            "",
            r["raw_markdown"], ""
        ]))
    (OUT_DIR / "site.md").write_text("\n".join(header + blocks), encoding="utf-8")

def write_site_jsonl(records):
    out = OUT_DIR / "site.jsonl"
    with out.open("w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

def main():
    # Search recursively for files in subdirectories
    md_files = list(EXTRACTOR_DIR.rglob("*.md"))
    meta_files = {stem_id(p): p for p in EXTRACTOR_DIR.rglob("*_metadata.json")}
    analysis_map: Dict[str, Dict[str, Path]] = {}
    
    # Find summary.json (could be in root or subdirectory)
    summary_path = ANALYSIS_DIR / "summary.json"
    if not summary_path.exists():
        summary_candidates = list(ANALYSIS_DIR.rglob("summary.json"))
        summary_path = summary_candidates[0] if summary_candidates else summary_path
    
    for p in ANALYSIS_DIR.rglob("*.json"):
        if p.name == "summary.json":
            continue
        stem = p.name.rsplit("_", 1)[0]
        analysis_map.setdefault(stem, {})
        if p.name.endswith("_analysis.json"): analysis_map[stem]["analysis"] = p
        if p.name.endswith("_metrics.json"): analysis_map[stem]["metrics"] = p
        if p.name.endswith("_classification.json"): analysis_map[stem]["classification"] = p
        if p.name.endswith("_sections.json"): analysis_map[stem]["sections"] = p

    records = []
    for md_path in md_files:
        stem = stem_id(md_path)
        rec = build_record(stem, md_path, meta_files.get(stem, Path()), analysis_map.get(stem, {}))
        records.append(rec)
        write_page_md(rec)

    write_site_md(records, summary_path)
    write_site_jsonl(records)
    print(f"✅ Wrote {len(records)} pages → {OUT_PAGES}")
    print(f"✅ Wrote site.md and site.jsonl → {OUT_DIR}")

if __name__ == "__main__":
    main()

