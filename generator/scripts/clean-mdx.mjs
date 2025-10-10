import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.resolve(__dirname, "../content/pages");

// Patterns to remove from AI-generated MDX
const PROBLEMATIC_PATTERNS = [
  // JavaScript code blocks
  /window\._[a-zA-Z]+ = .*?;/g,
  /_tkq = .*?;/g,
  /_stq = .*?;/g,
  // WordPress tracking code
  /_tkq\.push\(.*?\);/g,
  /_stq\.push\(.*?\);/g,
  // WordPress UI elements
  /Like Loading\.\.\./g,
  /Loading Comments\.\.\./g,
  /Write a Comment\.\.\./g,
  /Email \(Required\)/g,
  /Name \(Required\)/g,
  /Website/g,
  // Navigation menus that shouldn't be in content
  /Menu \+ × expanded collapsed/g,
  // Sign up/Log in links
  /-\s+\[Sign up\]\(.*?\)/g,
  /-\s+\[Log in\]\(.*?\)/g,
  /-\s+\[Copy shortlink\]\(.*?\)/g,
  /-\s+\[Report this content\]\(.*?\)/g,
  /-\s+\[Manage subscriptions\]\(.*?\)/g,
  // window.addEventListener tracking code
  /window\.addEventListener.*?document\.body\.appendChild\(\s*script\s*\);.*?}/gs,
];

// Additional lines to remove completely
const LINES_TO_REMOVE = [
  /^\s*Based on the provided source content/i,
  /^\s*\*\*PORTFOLIO\/GALLERY PAGE/i,
  /^\s*\*\*EXTRACT ALL IMAGES/i,
  /^\s*Since the source content/i,
  /^\s*As per the source content/i,
  /^\s*Please note that I have not added/i,
  /^\s*If you would like me to/i,
  /^\s*The hero section includes/i,
  /^\s*The about us section provides/i,
];

function cleanMDXContent(content) {
  let cleaned = content;
  
  // Remove problematic patterns
  for (const pattern of PROBLEMATIC_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Fix HTML form elements for MDX compatibility
  // Make input tags self-closing
  cleaned = cleaned.replace(/<input([^>]*?)(?<!\/)>/g, '<input$1 />');
  // Make br tags self-closing
  cleaned = cleaned.replace(/<br>/g, '<br />');
  cleaned = cleaned.replace(/<br\s*\/>/g, '<br />');
  // Make img tags self-closing
  cleaned = cleaned.replace(/<img([^>]*?)(?<!\/)>/g, '<img$1 />');
  
  // Fix malformed heading tags
  cleaned = cleaned.replace(/^# <H1>$/gm, '# Heading');
  cleaned = cleaned.replace(/^# <H2>$/gm, '## Heading');
  cleaned = cleaned.replace(/^# <H3>$/gm, '### Heading');
  
  // Remove any standalone HTML tag fragments
  cleaned = cleaned.replace(/^# <[A-Z][0-9]?>$/gm, '# Heading');
  cleaned = cleaned.replace(/^## <[A-Z][0-9]?>$/gm, '## Heading');
  cleaned = cleaned.replace(/^### <[A-Z][0-9]?>$/gm, '### Heading');
  
  // Remove specific lines
  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    return !LINES_TO_REMOVE.some(pattern => pattern.test(line));
  });
  
  cleaned = filteredLines.join('\n');
  
  // Remove excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

function cleanAllMDXFiles() {
  if (!fs.existsSync(PAGES_DIR)) {
    console.log("⚠️  No pages directory found");
    return;
  }
  
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  
  if (files.length === 0) {
    console.log("⚠️  No MDX files found");
    return;
  }
  
  let cleaned = 0;
  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const cleanedContent = cleanMDXContent(content);
    
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent, 'utf-8');
      cleaned++;
    }
  }
  
  console.log(`✓ Cleaned ${cleaned} of ${files.length} MDX files`);
}

cleanAllMDXFiles();

