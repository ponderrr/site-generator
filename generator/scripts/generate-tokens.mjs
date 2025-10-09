import fs from "node:fs";
import path from "node:path";

const CONFIG_PATH = path.resolve("../AI generation/config/site.config.yaml");
const TOKENS_OUTPUT = path.resolve("themes/default/tokens.ts");

// Simple YAML parser for our config structure
function parseYaml(yamlText) {
  const lines = yamlText.split('\n');
  const result = {};
  let currentSection = null;
  let currentKey = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Section headers (no indentation, ends with :)
    if (!line.startsWith(' ') && line.includes(':') && !line.includes(': ')) {
      currentSection = line.replace(':', '').trim();
      result[currentSection] = {};
      currentKey = currentSection;
      continue;
    }
    
    // Key-value pairs
    const match = line.match(/^\s*([^:]+):\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Handle different value types
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value.match(/^\d+$/)) value = parseInt(value);
      else if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      if (currentSection && result[currentSection]) {
        result[currentSection][key] = value;
      } else {
        result[key] = value;
      }
    }
    
    // List items
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && currentSection) {
      const lastKey = Object.keys(result[currentSection]).pop();
      if (!Array.isArray(result[currentSection][lastKey])) {
        result[currentSection][lastKey] = [];
      }
      result[currentSection][lastKey].push(listMatch[1].trim());
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


