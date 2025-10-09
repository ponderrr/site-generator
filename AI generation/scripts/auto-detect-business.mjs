import fs from "node:fs";
import path from "node:path";

const ANALYSIS_DIR = path.resolve("../analysis");
const CONFIG_PATH = path.resolve("config/site.config.yaml");

// Simple YAML writer
function writeYaml(data, filePath) {
  let yaml = '';
  
  // Brand section
  yaml += `brand:\n`;
  yaml += `  name: "${data.brandName || 'Your Business'}"\n`;
  yaml += `  voice: "${data.brandVoice || 'Professional, trustworthy, local business'}"\n`;
  yaml += `  reading_level: "${data.readingLevel || '8-11th grade'}"\n`;
  yaml += `  primary_cta: "${data.primaryCta || 'Get a Free Quote'}"\n`;
  yaml += `  locations_emphasis: ${data.locationsEmphasis || true}\n`;
  yaml += `\n`;
  
  // LLM section
  yaml += `llm:\n`;
  yaml += `  model: "llama3.1"\n`;
  yaml += `  # set to true to stream tokens to console in the driver\n`;
  yaml += `  stream: true\n`;
  yaml += `\n`;
  
  // Generation section
  yaml += `generation:\n`;
  yaml += `  per_page: true\n`;
  yaml += `  output_dir: "build/generated"\n`;
  yaml += `\n`;
  
  // Taxonomy section
  yaml += `taxonomy:\n`;
  yaml += `  page_types:\n`;
  yaml += `    - homepage\n`;
  yaml += `    - service\n`;
  yaml += `    - product\n`;
  yaml += `    - blog\n`;
  yaml += `    - contact\n`;
  yaml += `    - faq\n`;
  yaml += `    - location\n`;
  yaml += `    - legal\n`;
  yaml += `    - other\n`;
  yaml += `\n`;
  
  // Constants section
  yaml += `constants:\n`;
  yaml += `  company_name: "${data.companyName || data.brandName || 'Your Business'}"\n`;
  yaml += `  phone: "${data.phone || ''}"\n`;
  yaml += `  email: "${data.email || ''}"\n`;
  yaml += `  address: "${data.address || ''}"\n`;
  
  if (data.serviceAreas && data.serviceAreas.length > 0) {
    yaml += `  service_areas:\n`;
    for (const area of data.serviceAreas) {
      yaml += `    - "${area}"\n`;
    }
  } else {
    yaml += `  service_areas: []\n`;
  }
  
  fs.writeFileSync(filePath, yaml, 'utf-8');
}

// Extract business info from analysis files
function extractBusinessInfo() {
  const businessInfo = {
    brandName: null,
    companyName: null,
    phone: null,
    email: null,
    address: null,
    serviceAreas: [],
    brandVoice: null,
    primaryCta: null
  };

  try {
    // Find all analysis files
    const analysisFiles = [];
    
    if (fs.existsSync(ANALYSIS_DIR)) {
      const files = fs.readdirSync(ANALYSIS_DIR);
      for (const file of files) {
        if (file.endsWith('_analysis.json') || file.endsWith('_metadata.json')) {
          analysisFiles.push(path.join(ANALYSIS_DIR, file));
        }
      }
      
      // Also check subdirectories
      const subdirs = fs.readdirSync(ANALYSIS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
        
      for (const subdir of subdirs) {
        const subdirPath = path.join(ANALYSIS_DIR, subdir);
        const subfiles = fs.readdirSync(subdirPath);
        for (const file of subfiles) {
          if (file.endsWith('_analysis.json') || file.endsWith('_metadata.json')) {
            analysisFiles.push(path.join(subdirPath, file));
          }
        }
      }
    }

    console.log(`📊 Found ${analysisFiles.length} analysis files`);

    // Extract from extracted content
    const EXTRACTED_DIR = path.resolve("../extracted");
    if (fs.existsSync(EXTRACTED_DIR)) {
      const extractedFiles = [];
      
      const files = fs.readdirSync(EXTRACTED_DIR);
      for (const file of files) {
        if (file.endsWith('.md') && !file.includes('metadata')) {
          extractedFiles.push(path.join(EXTRACTED_DIR, file));
        }
      }
      
      // Also check subdirectories
      const subdirs = fs.readdirSync(EXTRACTED_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
        
      for (const subdir of subdirs) {
        const subdirPath = path.join(EXTRACTED_DIR, subdir);
        const subfiles = fs.readdirSync(subdirPath);
        for (const file of subfiles) {
          if (file.endsWith('.md') && !file.includes('metadata')) {
            extractedFiles.push(path.join(subdirPath, file));
          }
        }
      }

      console.log(`📄 Found ${extractedFiles.length} extracted content files`);

      // Analyze content for business info
      for (const filePath of extractedFiles) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Extract business name from title or first heading
          if (!businessInfo.brandName) {
            const titleMatch = content.match(/^#\s+(.+)$/m);
            if (titleMatch) {
              businessInfo.brandName = titleMatch[1].trim();
              businessInfo.companyName = businessInfo.brandName;
            }
          }

          // Extract phone numbers
          if (!businessInfo.phone) {
            const phoneMatch = content.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
            if (phoneMatch) {
              businessInfo.phone = phoneMatch[0];
            }
          }

          // Extract email addresses
          if (!businessInfo.email) {
            const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) {
              businessInfo.email = emailMatch[0];
            }
          }

          // Extract service areas - focus on the specific pattern first
          const servePattern = /serve\s+([^!]+?)\s+all\s+the\s+way\s+to\s+([^!]+)/i;
          const serveMatch = content.match(servePattern);
          
          if (serveMatch && serveMatch[1] && serveMatch[2]) {
            const city1 = serveMatch[1].trim().split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            
            const city2 = serveMatch[2].trim().split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            
            // Only add if they look like real city names
            if (/^[A-Za-z\s]+$/.test(city1) && city1.length >= 3 && city1.length <= 25) {
              businessInfo.serviceAreas.push(city1);
            }
            if (/^[A-Za-z\s]+$/.test(city2) && city2.length >= 3 && city2.length <= 25) {
              businessInfo.serviceAreas.push(city2);
            }
          }
          
          // Remove duplicates
          businessInfo.serviceAreas = [...new Set(businessInfo.serviceAreas)];


          // Detect business type and set appropriate voice
          if (!businessInfo.brandVoice) {
            const lowerContent = content.toLowerCase();
            if (lowerContent.includes('pressure wash') || lowerContent.includes('exterior cleaning')) {
              businessInfo.brandVoice = 'Professional, eco-friendly exterior cleaning specialists';
              businessInfo.primaryCta = 'Get a Free Quote';
            } else if (lowerContent.includes('restaurant') || lowerContent.includes('dining')) {
              businessInfo.brandVoice = 'Warm, welcoming family restaurant experience';
              businessInfo.primaryCta = 'Make a Reservation';
            } else if (lowerContent.includes('medical') || lowerContent.includes('clinic') || lowerContent.includes('health')) {
              businessInfo.brandVoice = 'Caring, professional healthcare providers';
              businessInfo.primaryCta = 'Schedule Appointment';
            } else if (lowerContent.includes('legal') || lowerContent.includes('attorney') || lowerContent.includes('law')) {
              businessInfo.brandVoice = 'Experienced, trustworthy legal professionals';
              businessInfo.primaryCta = 'Free Consultation';
            } else if (lowerContent.includes('contractor') || lowerContent.includes('construction') || lowerContent.includes('remodeling')) {
              businessInfo.brandVoice = 'Reliable, skilled construction professionals';
              businessInfo.primaryCta = 'Get Estimate';
            } else {
              businessInfo.brandVoice = 'Professional, trustworthy local business';
              businessInfo.primaryCta = 'Contact Us';
            }
          }

        } catch (err) {
          console.warn(`⚠️  Could not read ${filePath}:`, err.message);
        }
      }
    }

    // Process analysis files
    for (const filePath of analysisFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        // Extract from metadata
        if (data.title && !businessInfo.brandName) {
          businessInfo.brandName = data.title;
          businessInfo.companyName = data.title;
        }
        
        if (data.url) {
          // Extract domain name as fallback business name
          try {
            const url = new URL(data.url);
            const domain = url.hostname.replace('www.', '').split('.')[0];
            if (!businessInfo.brandName && domain.length > 3) {
              businessInfo.brandName = domain.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
            }
          } catch (e) {
            // Ignore invalid URLs
          }
        }

      } catch (err) {
        console.warn(`⚠️  Could not parse ${filePath}:`, err.message);
      }
    }

  } catch (err) {
    console.error('❌ Error analyzing files:', err.message);
  }

  return businessInfo;
}

function main() {
  console.log('🔍 Auto-detecting business information...');
  
  const businessInfo = extractBusinessInfo();
  
  console.log('\n📋 Detected Business Information:');
  console.log(`   Business Name: ${businessInfo.brandName || 'Not detected'}`);
  console.log(`   Phone: ${businessInfo.phone || 'Not detected'}`);
  console.log(`   Email: ${businessInfo.email || 'Not detected'}`);
  console.log(`   Service Areas: ${businessInfo.serviceAreas.length > 0 ? businessInfo.serviceAreas.join(', ') : 'Not detected'}`);
  console.log(`   Brand Voice: ${businessInfo.brandVoice || 'Default'}`);
  console.log(`   Primary CTA: ${businessInfo.primaryCta || 'Default'}`);
  
  if (businessInfo.brandName) {
    console.log('\n✅ Generating site.config.yaml...');
    writeYaml(businessInfo, CONFIG_PATH);
    console.log('✅ Configuration file created successfully!');
    console.log('\n📝 You can now run:');
    console.log('   py packager/package_site.py');
    console.log('   py drivers/generate_pages_ollama.py');
  } else {
    console.log('\n❌ Could not detect business name. Please check your extracted content.');
    console.log('   Make sure you have crawled and analyzed a website first.');
  }
}

main();
