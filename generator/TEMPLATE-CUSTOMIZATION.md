# Template Customization Guide

This guide explains how to customize the templates and remove hardcoded content from your site generator.

## Overview

All hardcoded content has been moved to a centralized configuration system. You can now customize:
- All text and copy across templates
- CTA (Call-to-Action) buttons and labels
- Images
- Business hours
- Navigation (dynamically generated from routes)

## Configuration Files

### 1. **`AI generation/config/site.config.yaml`**

This is the master configuration file where you define all customizable content.

### 2. **`generator/themes/default/tokens.ts`**

This file is auto-generated from `site.config.yaml`. **Do not edit it manually!**

To update tokens:
```bash
cd generator
npm run generate:tokens
```

## Configuration Structure

### Basic Brand Information

```yaml
brand:
  name: "Your Business Name"
  tagline: "Your Business Tagline"
  primary_cta: "Get a Free Quote"
  secondary_cta: "Learn More"
```

### Copy Configuration

All template text can be customized in the `brand.copy` section:

```yaml
brand:
  copy:
    # Homepage
    homepage_hero_fallback: "Welcome to Our Business"
    homepage_cta_heading: "Ready to Get Started?"
    homepage_cta_text: "Get in touch today for a free consultation"
    
    # Contact page
    contact_hero_fallback: "Get in Touch"
    contact_subtitle: "We're here to help with your needs"
    contact_heading: "Get in Touch"
    contact_subheading: "Ready to get started? Contact us today."
    contact_hours_heading: "Business Hours"
    contact_hours_subtitle: "We're here when you need us most."
    contact_hours_note: "Contact us to schedule an appointment"
    contact_button_call: "Call Now"
    contact_button_email: "Email Us"
    
    # Service page
    service_hero_fallback: "Our Services"
    service_description_fallback: "Quality services tailored to your needs"
    service_cta_heading: "Ready to Get Started?"
    service_cta_text: "Contact us today for more information"
    
    # Other/Gallery page
    other_hero_fallback: "Our Work"
    other_description_fallback: "See the quality of our work"
    other_cta_heading: "Impressed by Our Work?"
    other_cta_text: "Let us help with your next project"
    
    # Generic CTA
    generic_cta_label: "Get a Free Quote"
    
    # Section labels
    label_phone: "Phone"
    label_email: "Email"
    label_service_areas: "Service Areas"
```

### Business Hours

```yaml
brand:
  hours:
    days: "Monday - Friday"
    time: "9:00 AM - 6:00 PM"
```

### Images

Configure images for different sections:

```yaml
brand:
  images:
    contact_main: "https://your-image-url.com/contact.jpg"
    contact_hours: "https://your-image-url.com/hours.jpg"
```

### Contact Information

```yaml
constants:
  company_name: "Your Business Name"
  phone: "(555) 555-5555"
  email: "contact@yourbusiness.com"
  service_areas:
    - "City 1"
    - "City 2"
```

## Template Usage

All templates now pull content from the tokens object. Here's how they work:

### Homepage Template

- **Hero title**: Uses `meta.title` → `tokens.brandName` → `tokens.copy.homepageHeroFallback`
- **Hero subtitle**: Uses `tokens.tagline`
- **CTA button**: Uses `tokens.primaryCta`
- **Bottom CTA heading**: Uses `tokens.copy.homepageCtaHeading`
- **Bottom CTA text**: Uses `tokens.copy.homepageCtaText`

### Contact Template

- **Hero title**: Uses `meta.title` → `tokens.copy.contactHeroFallback`
- **Hero subtitle**: Uses `meta.description` → `tokens.copy.contactSubtitle`
- **Section headings**: All configurable via `tokens.copy.*`
- **Button labels**: Uses `tokens.copy.contactButtonCall` and `tokens.copy.contactButtonEmail`
- **Business hours**: Uses `tokens.hours.days`, `tokens.hours.time`, `tokens.hours.note`
- **Images**: Uses `tokens.images.contactMain` and `tokens.images.contactHours`
- **Labels**: Uses `tokens.copy.labelPhone`, `tokens.copy.labelEmail`, etc.

### Service Template

- **Hero title**: Uses `meta.title` → `tokens.copy.serviceHeroFallback`
- **Hero subtitle**: Uses `meta.description` → `tokens.copy.serviceDescriptionFallback`
- **CTA section**: Uses `tokens.copy.serviceCtaHeading` and `tokens.copy.serviceCtaText`
- **CTA button**: Uses `tokens.primaryCta`

### Other/Gallery Template

- **Hero title**: Uses `meta.title` → `tokens.copy.otherHeroFallback`
- **Hero subtitle**: Uses `meta.description` → `tokens.copy.otherDescriptionFallback`
- **CTA section**: Uses `tokens.copy.otherCtaHeading` and `tokens.copy.otherCtaText`
- **CTA button**: Uses `tokens.primaryCta`

### Blog, FAQ, Legal, Location, Product Templates

All these templates now use:
- **CTA label**: `tokens.copy.genericCtaLabel` or `tokens.primaryCta`

## Dynamic Navigation

Navigation is now automatically generated from `route-map.json`:

- The layout checks for routes matching priority URLs: `[/, /services, /our-work, /about, /contact]`
- Links are sorted in priority order
- Labels come from the `title` field in route-map
- If route-map is empty, it falls back to basic navigation

### Customizing Navigation Priority

To change which pages appear in the navigation, edit `generator/app/layout.tsx`:

```typescript
const priorityUrls = ['/', '/services', '/your-custom-page', '/contact'];
```

## Industry-Specific Customization

### For E-commerce Businesses

```yaml
brand:
  primary_cta: "Shop Now"
  secondary_cta: "View Products"
  copy:
    homepage_cta_heading: "Ready to Shop?"
    homepage_cta_text: "Browse our collection"
    service_hero_fallback: "Our Products"
    service_cta_text: "Explore our catalog"
    generic_cta_label: "Shop Now"
```

### For Professional Services

```yaml
brand:
  primary_cta: "Schedule Consultation"
  secondary_cta: "Learn More"
  copy:
    homepage_cta_heading: "Ready to Transform Your Business?"
    homepage_cta_text: "Let's discuss your needs"
    service_hero_fallback: "Our Services"
    service_cta_text: "Contact us to learn more"
    generic_cta_label: "Schedule Consultation"
```

### For Restaurants

```yaml
brand:
  primary_cta: "View Menu"
  secondary_cta: "Make Reservation"
  copy:
    homepage_cta_heading: "Hungry?"
    homepage_cta_text: "Order online or reserve a table"
    service_hero_fallback: "Our Menu"
    service_cta_text: "See what's cooking"
    generic_cta_label: "Order Now"
```

### For Real Estate

```yaml
brand:
  primary_cta: "View Listings"
  secondary_cta: "Schedule Tour"
  copy:
    homepage_cta_heading: "Find Your Dream Home"
    homepage_cta_text: "Browse available properties"
    service_hero_fallback: "Our Properties"
    service_cta_text: "Schedule a viewing"
    generic_cta_label: "View Listings"
```

## Updating Your Site

After modifying `site.config.yaml`:

1. **Regenerate tokens**:
   ```bash
   cd generator
   npm run generate:tokens
   ```

2. **Rebuild your site**:
   ```bash
   npm run build
   ```

3. **Test locally**:
   ```bash
   npm run dev
   ```

## Fallback System

All templates use a fallback chain:

1. **Page-specific metadata** (from MDX frontmatter or route-map)
2. **Token configuration** (from site.config.yaml)
3. **Default fallback** (generic text)

This ensures your site always has content, even if configuration is incomplete.

## Example: Complete Configuration

```yaml
brand:
  name: "Acme Services"
  voice: "Professional and friendly"
  reading_level: "8-11th grade"
  primary_cta: "Get Started"
  secondary_cta: "Learn More"
  locations_emphasis: true
  tagline: "Quality Service You Can Trust"
  
  copy:
    homepage_hero_fallback: "Welcome to Acme"
    homepage_cta_heading: "Ready to Begin?"
    homepage_cta_text: "Let's discuss your project"
    
    contact_hero_fallback: "Contact Us"
    contact_subtitle: "We're here to help"
    contact_heading: "Get in Touch"
    contact_subheading: "Reach out for a consultation"
    contact_hours_heading: "When We're Available"
    contact_hours_subtitle: "We're here for you"
    contact_hours_note: "Call to schedule"
    contact_button_call: "Call Today"
    contact_button_email: "Send Email"
    
    service_hero_fallback: "What We Do"
    service_description_fallback: "Professional services"
    service_cta_heading: "Let's Work Together"
    service_cta_text: "Contact us to get started"
    
    other_hero_fallback: "Portfolio"
    other_description_fallback: "See our work"
    other_cta_heading: "Like What You See?"
    other_cta_text: "Let's create something amazing"
    
    generic_cta_label: "Contact Us"
    
    label_phone: "Call Us"
    label_email: "Email Us"
    label_service_areas: "We Serve"
    
  hours:
    days: "Mon-Fri"
    time: "8 AM - 6 PM"
    
  images:
    contact_main: "https://example.com/contact.jpg"
    contact_hours: "https://example.com/office.jpg"

constants:
  company_name: "Acme Services"
  phone: "(555) 123-4567"
  email: "info@acme.com"
  service_areas:
    - "Downtown"
    - "Suburbs"
```

## Troubleshooting

### Tokens not updating?

1. Make sure you saved `site.config.yaml`
2. Run `npm run generate:tokens` from the `generator` directory
3. Check for YAML syntax errors
4. Rebuild your site

### Navigation not showing my pages?

1. Check `route-map.json` - are your routes listed?
2. Verify the route URLs match the `priorityUrls` array in `layout.tsx`
3. Check that routes have a `title` field

### Images not displaying?

1. Verify the image URLs are accessible
2. Check that URLs are properly quoted in YAML
3. Ensure `tokens.images.*` fields are configured

## Best Practices

1. **Always use tokens**: Never hardcode text directly in templates
2. **Provide fallbacks**: Always include fallback text in templates
3. **Test your config**: Run the site locally after changes
4. **Version control**: Commit both `site.config.yaml` and generated `tokens.ts`
5. **Industry-specific**: Customize all copy to match your business type
6. **Keep it simple**: Use clear, concise language
7. **A/B test CTAs**: Try different CTA text to see what converts better

## Additional Resources

- See `generator/themes/default/templates/` for template source code
- See `generator/scripts/generate-tokens.mjs` for token generation logic
- See `generator/app/layout.tsx` for navigation generation

