import fs from "node:fs";
import path from "node:path";

const CONFIG_PATH = path.resolve("../AI generation/config/site.config.yaml");
const TOKENS_OUTPUT = path.resolve("themes/default/tokens.ts");

// Enhanced YAML parser for nested config structure
function parseYaml(yamlText) {
  const lines = yamlText.split('\n');
  const result = {};
  const stack = [{ obj: result, indent: -1 }];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.search(/\S/);
    const match = line.match(/^\s*([^:]+):\s*(.*)$/);
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    
    // Handle list items
    if (listMatch) {
      const value = listMatch[1].trim();
      const cleanValue = value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
      const parent = stack[stack.length - 1].obj;
      const lastKey = Object.keys(parent).pop();
      
      if (!Array.isArray(parent[lastKey])) {
        parent[lastKey] = [];
      }
      parent[lastKey].push(cleanValue);
      continue;
    }
    
    // Handle key-value pairs
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Pop stack to correct level
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
      
      const parent = stack[stack.length - 1].obj;
      
      // Handle different value types
      if (!value) {
        // Key with nested values
        parent[key] = {};
        stack.push({ obj: parent[key], indent });
      } else {
        // Key with immediate value
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value.match(/^\d+$/)) value = parseInt(value);
        else if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        parent[key] = value;
      }
    }
  }
  
  return result;
}

try {
  // Read and parse site config
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("❌ site.config.yaml not found at:", CONFIG_PATH);
    process.exit(1);
  }

  const yamlContent = fs.readFileSync(CONFIG_PATH, "utf-8");
  const config = parseYaml(yamlContent);

  // Generate tokens object from config
  const tokens = {
    brandName: config.brand?.name || config.constants?.company_name || "Your Business",
    tagline: config.brand?.tagline || `Professional ${config.brand?.name || "Business"} Services`,
    phone: config.constants?.phone || "",
    email: config.constants?.email || "",
    serviceArea: config.constants?.service_areas 
      ? `Serving ${config.constants.service_areas[0]} → ${config.constants.service_areas[config.constants.service_areas.length - 1]}`
      : "",
    serviceAreaCities: config.constants?.service_areas || [],
    primaryCta: config.brand?.primary_cta || "Get a Free Quote",
    secondaryCta: config.brand?.secondary_cta || "Learn More",
    
    // Business hours
    hours: {
      days: config.brand?.hours?.days || "Monday - Friday",
      time: config.brand?.hours?.time || "9:00 AM - 6:00 PM",
      note: config.brand?.copy?.contact_hours_note || "Contact us to schedule an appointment"
    },
    
    // Copy/text configuration
    copy: {
      // Homepage
      homepageHeroFallback: config.brand?.copy?.homepage_hero_fallback || "Welcome to Our Business",
      homepageCtaHeading: config.brand?.copy?.homepage_cta_heading || "Ready to Get Started?",
      homepageCtaText: config.brand?.copy?.homepage_cta_text || "Get in touch today for a free consultation",
      
      // Contact page
      contactHeroFallback: config.brand?.copy?.contact_hero_fallback || "Get in Touch",
      contactSubtitle: config.brand?.copy?.contact_subtitle || "We're here to help with your needs",
      contactHeading: config.brand?.copy?.contact_heading || "Get in Touch",
      contactSubheading: config.brand?.copy?.contact_subheading || "Ready to get started? Contact us today.",
      contactHoursHeading: config.brand?.copy?.contact_hours_heading || "Business Hours",
      contactHoursSubtitle: config.brand?.copy?.contact_hours_subtitle || "We're here when you need us most.",
      contactButtonCall: config.brand?.copy?.contact_button_call || "Call Now",
      contactButtonEmail: config.brand?.copy?.contact_button_email || "Email Us",
      
      // Service page
      serviceHeroFallback: config.brand?.copy?.service_hero_fallback || "Our Services",
      serviceDescriptionFallback: config.brand?.copy?.service_description_fallback || "Quality services tailored to your needs",
      serviceCtaHeading: config.brand?.copy?.service_cta_heading || "Ready to Get Started?",
      serviceCtaText: config.brand?.copy?.service_cta_text || "Contact us today for more information",
      
      // Other/Gallery page
      otherHeroFallback: config.brand?.copy?.other_hero_fallback || "Our Work",
      otherDescriptionFallback: config.brand?.copy?.other_description_fallback || "See the quality of our work",
      otherCtaHeading: config.brand?.copy?.other_cta_heading || "Impressed by Our Work?",
      otherCtaText: config.brand?.copy?.other_cta_text || "Let us help with your next project",
      
      // Generic CTA
      genericCtaLabel: config.brand?.copy?.generic_cta_label || "Get a Free Quote",
      
      // Section labels
      labelPhone: config.brand?.copy?.label_phone || "Phone",
      labelEmail: config.brand?.copy?.label_email || "Email",
      labelServiceAreas: config.brand?.copy?.label_service_areas || "Service Areas"
    },
    
    // Images
    images: {
      contactMain: config.brand?.images?.contact_main || "",
      contactHours: config.brand?.images?.contact_hours || ""
    },
    
    colors: {
      primary: "#0ea5e9",
      primaryDark: "#0284c7",
      primaryLight: "#38bdf8",
      secondary: "#10b981",
      secondaryDark: "#059669",
      accent: "#f59e0b",
      background: "#ffffff",
      backgroundLight: "#f8fafc",
      backgroundDark: "#1e293b",
      text: "#0f172a",
      textLight: "#64748b",
      textMuted: "#94a3b8",
      border: "#e2e8f0",
      borderLight: "#f1f5f9",
      white: "#ffffff",
      black: "#111827"
    },
    fonts: {
      body: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      heading: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    },
    fontSizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem"
    },
    radii: { 
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      full: "9999px"
    },
    spacing: { 
      xs: 4, 
      s: 8, 
      m: 16, 
      l: 24, 
      xl: 32,
      "2xl": 48, 
      "3xl": 64,
      "4xl": 80,
      "5xl": 96
    },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
      xl: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)"
    },
    transitions: {
      fast: "0.15s",
      base: "0.3s",
      slow: "0.5s"
    }
  };

  // Generate TypeScript file
  const tsContent = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated from: AI generation/config/site.config.yaml
// To update, modify the config file and run: npm run generate:tokens

const tokens = ${JSON.stringify(tokens, null, 2)};

export default tokens;
`;

  // Write tokens file
  fs.mkdirSync(path.dirname(TOKENS_OUTPUT), { recursive: true });
  fs.writeFileSync(TOKENS_OUTPUT, tsContent, "utf-8");
  
  console.log("✅ Generated tokens.ts from site.config.yaml");
  console.log(`   Brand: ${tokens.brandName}`);
  console.log(`   Phone: ${tokens.phone}`);
  console.log(`   Service Areas: ${tokens.serviceAreaCities.length} cities`);

} catch (error) {
  console.error("❌ Error generating tokens:", error.message);
  process.exit(1);
}


