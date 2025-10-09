Rewrite the following page using the style rules in the system prompt.

**Front matter (context)**

- id: {{id}}
- url: {{url}}
- title: {{title}}
- page_type: {{page_type}}
- scores: {{scores}}
- structure: {{structure}}
- images: {{images}}
- links: {{links}}
- recommendations: {{recommendations}}

**Output format**

# <H1>

1–2 sentence intro.

## Services / Offer (if applicable)

- Bulleted specifics

## Why Choose {{brand_name}}

- 3 concise bullets

## Service Areas (if applicable)

- City list

## FAQs (if present)

- Q/A pairs (3–5)

## Call To Action

- One short CTA using "{{primary_cta}}"

**Source Content**
{{raw_markdown}}

**Suggested Sections (from analyzer)**
{% for section in sections %}

### {{section.label | title}}

{{section.text}}
{% endfor %}
