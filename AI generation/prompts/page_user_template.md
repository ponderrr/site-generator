You are {{brand_name}}. Write your {{page_type}} page content below. Use the source content to create your actual business page.

**CRITICAL OUTPUT RULES - READ CAREFULLY:**
- Your FIRST line MUST be the H1 heading (starting with #)
- Your LAST line MUST be the final CTA sentence
- FORBIDDEN: Any text like "Based on...", "Here is...", "I will...", "This page...", "Note:...", "Content Summary", "Suggested Improvements", "Code Analysis", "Code Improvements", "Additional Recommendations"
- FORBIDDEN: Any explanatory text before the H1 or after the CTA
- OUTPUT ONLY THE ACTUAL PAGE CONTENT - Nothing else!
- **PAGE TYPE: {{page_type}} - Generate ONLY content appropriate for this page type**
- **DO NOT duplicate content from other page types (homepage content on contact page, etc.)**
- **WRITE AS THE BUSINESS OWNER, NOT AS AN ANALYST**
- **DO NOT ANALYZE THE CODE - WRITE THE ACTUAL WEBSITE CONTENT**

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

**CRITICAL IMAGE EXTRACTION PROCESS:**
1. **SCAN SOURCE MARKDOWN** - Look for ANY image URLs (Google Sites, etc.) in the raw_markdown section below
2. **EXTRACT ALL REAL IMAGES** - Use every found image with descriptive alt text like `![Business Service](actual-image-url)`
3. **FILL GAPS WITH PLACEHOLDERS** - For missing images, use contextual Unsplash:
   - Hero: `![Hero Image](https://source.unsplash.com/1920x1080/?[business-type],[service])`
   - Service: `![Service Name](https://source.unsplash.com/800x500/?[service],[cleaning])`
   - Gallery: `![Work Example](https://source.unsplash.com/600x400/?before-after,[business])`
4. **ADD REPLACEMENT NOTES** - After EVERY placeholder: `*[REPLACE: Upload actual business photo]*`

**Output format - PAGE TYPE SPECIFIC:**

{% if page_type == 'homepage' %}
# <H1>

**Hero Image** (required): 
- FIRST: Extract any large images from source markdown - use the best one
- If no source image: `![Hero Image](https://source.unsplash.com/1920x1080/?[business-type],[main-service],[professional])`
- Add note: *[REPLACE: Upload actual business hero photo]*

1–2 sentence intro.

## Services / Offer

Create service cards with images using this format:
```html
<div class="services-grid">
  <div class="service-card">
    <div class="service-image">
      <img src="[IMAGE_URL]" alt="[SERVICE_NAME]" class="service-img">
    </div>
    <div class="service-content">
      <h3 class="service-title">[SERVICE_NAME]</h3>
      <p class="service-description">[SERVICE_DESCRIPTION]</p>
    </div>
  </div>
</div>
```

- **Use ALL service images** from source markdown if present
- **For missing images**: Use `https://source.unsplash.com/400x300/?[specific-service],[cleaning]` + *[REPLACE: Upload actual service photo]*

## Why Choose {{brand_name}}

- 3 concise bullets

## Service Areas

- City list

## Our Work / Gallery

**EXTRACT ALL IMAGES from source markdown** - Look carefully in raw_markdown section below
If no images found, create 3-4 placeholders: `![Work Example](https://source.unsplash.com/600x400/?before-after,[business-type],[clean])` + *[REPLACE: Upload actual work photos]*

## FAQs (if present)

- Q/A pairs (3–5)

## Call To Action

- One short CTA using "{{primary_cta}}"

{% elif page_type == 'contact' %}
# <H1>

**CONTACT PAGE - NO HERO IMAGES, NO SERVICES, NO GALLERY**

Brief intro about contacting the business.

## Contact Information

- Phone, email, address details
- **NO service images or hero images**

## Hours of Operation

- Business hours and scheduling info

## Service Areas

- Areas served (brief list)

## Call To Action

- Contact CTA using "{{primary_cta}}"

{% elif page_type == 'service' %}
# <H1>

**SERVICE PAGE - FOCUS ON SPECIFIC SERVICES ONLY**

Brief intro about the specific service.

## Service Details

- Detailed service information
- **Include service image** from source markdown if present
- **For missing image**: Use service card format:
```html
<div class="service-card">
  <div class="service-image">
    <img src="https://source.unsplash.com/400x300/?[specific-service],[cleaning]" alt="[SERVICE_NAME]" class="service-img">
  </div>
  <div class="service-content">
    <h3 class="service-title">[SERVICE_NAME]</h3>
    <p class="service-description">[SERVICE_DESCRIPTION]</p>
  </div>
</div>
```
- Add note: *[REPLACE: Upload actual service photo]*

## Process / How It Works

- Step-by-step process if applicable

## Call To Action

- Service-specific CTA using "{{primary_cta}}"

{% elif page_type == 'services' %}
# <H1>

Brief intro about the services offered.

## Our Services

**EXTRACT ALL SERVICE IMAGES from source markdown** - Look carefully for service-related images
Create expandable service cards using this format:
```html
<div class="services-grid">
  <div class="service-card">
    <div class="service-image">
      <img src="[EXTRACTED_IMAGE_URL]" alt="[SERVICE_NAME]" class="service-img">
    </div>
    <div class="service-content">
      <h3 class="service-title">[SERVICE_NAME]</h3>
      <p class="service-description">[SERVICE_DESCRIPTION]</p>
      <div class="service-expanded">
        <p class="service-details">[DETAILED_SERVICE_INFO]</p>
      </div>
      <button class="service-toggle">Learn More</button>
    </div>
  </div>
</div>
```

- **Use ALL service images** from source markdown if present
- **For missing images**: Use `https://source.unsplash.com/400x300/?[specific-service],[cleaning]` + *[REPLACE: Upload actual service photo]*
- Create 3-6 service cards based on content found

## Call To Action

- Contact CTA using "{{primary_cta}}"

{% elif page_type == 'other' or page_type == 'our-work' %}
# <H1>

**PORTFOLIO/GALLERY PAGE - FOCUS ON WORK EXAMPLES ONLY**

Brief intro about the work/portfolio.

## Our Work / Gallery

**EXTRACT ALL IMAGES from source markdown** - Look carefully in raw_markdown section below:
- If source has images: use ALL of them with descriptive alt text
- If no source images: create 3-4 contextual placeholders:
  - `![Work Example 1](https://source.unsplash.com/600x400/?before-after,[business-type],[clean])`
  - *[REPLACE: Upload actual work photos]*

## Call To Action

- Portfolio CTA using "{{primary_cta}}"

{% else %}
# <H1>

Brief intro relevant to the page type.

## Main Content

- Page-type specific content only

## Call To Action

- Appropriate CTA using "{{primary_cta}}"
{% endif %}

**Source Content**
{{raw_markdown}}

**Suggested Sections (from analyzer)**
{% for section in sections %}

### {{section.label | title}}

{{section.text}}
{% endfor %}
