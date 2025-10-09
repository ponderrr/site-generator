import json, subprocess, sys
from pathlib import Path
import yaml

# Fix Windows console encoding for emoji/unicode
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
CONF = yaml.safe_load((ROOT / "config" / "site.config.yaml").read_text(encoding="utf-8"))
MODEL = CONF["llm"]["model"]
STREAM = bool(CONF["llm"].get("stream", True))

PAGES_DIR = ROOT / "build" / "pack" / "pages"
OUT_DIR = (ROOT / CONF["generation"]["output_dir"]).resolve()
OUT_DIR.mkdir(parents=True, exist_ok=True)

SYSTEM_TMPL = (ROOT / "prompts" / "system_template.md").read_text(encoding="utf-8")
USER_TMPL = (ROOT / "prompts" / "page_user_template.md").read_text(encoding="utf-8")

def render(text: str, ctx: dict) -> str:
    # Simple double-curly replacement & tiny loop for sections
    out = text
    for k, v in {
        "brand_name": CONF["brand"]["name"],
        "brand_voice": CONF["brand"]["voice"],
        "reading_level": CONF["brand"]["reading_level"],
        "primary_cta": CONF["brand"]["primary_cta"],
        "locations_emphasis": CONF["brand"]["locations_emphasis"],
        "company_name": CONF["constants"]["company_name"],
        "phone": CONF["constants"]["phone"],
        "email": CONF["constants"]["email"],
        "address": CONF["constants"]["address"],
        "service_areas": ", ".join(CONF["constants"].get("service_areas", [])),
    }.items():
        out = out.replace(f"{{{{{k}}}}}", str(v))

    for k, v in ctx.items():
        if isinstance(v, (dict, list)):
            out = out.replace(f"{{{{{k}}}}}", json.dumps(v, ensure_ascii=False))
        else:
            out = out.replace(f"{{{{{k}}}}}", str(v))

    # sections loop
    if "{{sections}}" in out or "{% for section in sections %}" in out:
        block = ""
        sections = ctx.get("sections", [])
        for s in sections:
            block += f"### {s.get('label','Section').title()}\n{s.get('text','')}\n\n"
        out = out.replace("{% for section in sections %}\n### {{section.label | title}}\n{{section.text}}\n{% endfor %}", block)
        out = out.replace("{% for section in sections %}{% endfor %}", block)  # minimal fallback
    return out

def call_ollama(system: str, prompt: str) -> str:
    # Use `ollama run` with system and prompt; return model output text
    cmd = ["ollama", "run", MODEL,]
    # Compose a single prompt with system preface (ollama doesn't have separate roles by default)
    composed = f"<<SYS>>\n{system}\n<</SYS>>\n\n{prompt}"
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, 
                        text=True, encoding='utf-8', errors='replace')
    out, err = p.communicate(composed)
    if err and "error" in err.lower():
        print(err, file=sys.stderr)
    return out.strip()

def parse_front_matter(md_text: str) -> (dict, str):
    if md_text.startswith("---"):
        end = md_text.find("\n---", 3)
        if end != -1:
            import yaml
            fm = yaml.safe_load(md_text[3:end])
            body = md_text[end+4:].lstrip("\n")
            return fm or {}, body
    return {}, md_text

def main():
    files = sorted(PAGES_DIR.glob("*.md"))
    if not files:
        print("No pages found. Run packager/package_site.py first.")
        sys.exit(1)

    for f in files:
        text = f.read_text(encoding="utf-8")
        front, body = parse_front_matter(text)
        # Build context for the template
        ctx = {
            "id": front.get("id", f.stem),
            "url": front.get("url", ""),
            "title": front.get("title", f.stem),
            "page_type": front.get("page_type", "other"),
            "scores": front.get("scores", {}),
            "structure": front.get("structure", []),
            "images": front.get("images", []),
            "links": front.get("links", []),
            "recommendations": front.get("recommendations", []),
            "raw_markdown": body,
            "sections": [],  # sections were appended into the body already; leave empty here
        }
        system = render(SYSTEM_TMPL, {})
        user = render(USER_TMPL, ctx)
        output = call_ollama(system, user)
        (OUT_DIR / f"{f.stem}.md").write_text(output, encoding="utf-8")
        print(f"✅ Generated {f.stem}.md")

if __name__ == "__main__":
    main()

