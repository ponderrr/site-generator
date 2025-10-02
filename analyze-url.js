#!/usr/bin/env node

/**
 * Analyze HTML from a URL
 * 
 * Usage: node analyze-url.js https://example.com
 */

import https from 'https';
import http from 'http';

function fetchURL(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    // Prevent infinite redirect loops
    if (redirectCount > 5) {
      reject(new Error('Too many redirects'));
      return;
    }
    
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    };
    
    client.get(options, (response) => {
      // Handle redirects (301, 302, 307, 308)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = response.headers.location;
        // Handle relative redirects
        const newUrl = redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, url).href;
        console.log(`↪️  Following redirect to: ${newUrl}`);
        return fetchURL(newUrl, redirectCount + 1).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch: HTTP ${response.statusCode}`));
        return;
      }
      
      let html = '';
      response.on('data', chunk => html += chunk);
      response.on('end', () => resolve(html));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function analyzeURL(url) {
  console.log('🚀 Site Generator - URL Analyzer\n');
  console.log('━'.repeat(60));
  
  console.log('\n📡 Fetching HTML from:', url);
  console.log('⏳ Please wait...\n');
  
  try {
    const html = await fetchURL(url);
    console.log('✅ Fetched successfully!');
    console.log('📏 HTML Size:', (html.length / 1024).toFixed(2), 'KB\n');
    
    console.log('━'.repeat(60));
    console.log('\n📊 Analyzing Content...\n');
    
    // Extract basic information
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title found';
    
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    const description = descMatch ? descMatch[1] : 'No description found';
    
    // Count elements
    const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
    const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
    const pCount = (html.match(/<p[^>]*>/gi) || []).length;
    const imgCount = (html.match(/<img[^>]*>/gi) || []).length;
    const linkCount = (html.match(/<a[^>]*href/gi) || []).length;
    
    // Estimate word count
    const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
    const wordCount = textContent.split(' ').filter(w => w.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    // Detect page elements
    const hasNav = /<nav[^>]*>/i.test(html);
    const hasHeader = /<header[^>]*>/i.test(html);
    const hasFooter = /<footer[^>]*>/i.test(html);
    const hasArticle = /<article[^>]*>/i.test(html);
    const hasForm = /<form[^>]*>/i.test(html);
    const hasCTA = /subscribe|sign up|get started|buy now|learn more|download|register/i.test(html);
    
    // Classify page type
    let pageType = 'general';
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('/blog/') || urlLower.includes('/post/') || urlLower.includes('/article/')) {
      pageType = 'blog-post';
    } else if (urlLower.includes('/product/') || urlLower.includes('/shop/')) {
      pageType = 'product-page';
    } else if (urlLower.includes('/about')) {
      pageType = 'about-page';
    } else if (urlLower.includes('/contact')) {
      pageType = 'contact-page';
    } else if (urlLower.match(/\/(index|home)/) || url.split('/').length <= 4) {
      pageType = 'home-page';
    } else if (hasArticle && pCount > 5) {
      pageType = 'article/blog';
    } else if (hasCTA && hasForm) {
      pageType = 'landing-page';
    }
    
    // Display results
    console.log('📝 Page Information:');
    console.log('  URL:', url);
    console.log('  Title:', title);
    console.log('  Description:', description.substring(0, 100) + (description.length > 100 ? '...' : ''));
    
    console.log('\n📈 Content Metrics:');
    console.log('  Word Count:', wordCount.toLocaleString());
    console.log('  Reading Time:', readingTime, 'minutes');
    console.log('  H1 Headings:', h1Count);
    console.log('  H2 Headings:', h2Count);
    console.log('  Paragraphs:', pCount);
    console.log('  Images:', imgCount);
    console.log('  Links:', linkCount);
    
    console.log('\n🎯 Page Classification:');
    console.log('  Type:', pageType);
    
    console.log('\n🎨 Detected Sections:');
    const sections = [];
    if (hasHeader) sections.push('Header');
    if (hasNav) sections.push('Navigation');
    if (hasArticle) sections.push('Article/Main Content');
    if (hasForm) sections.push('Form');
    if (hasCTA) sections.push('Call-to-Action');
    if (hasFooter) sections.push('Footer');
    
    sections.forEach(section => console.log('  ✓', section));
    
    // Extract first heading as preview
    const firstH1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (firstH1) {
      const h1Text = firstH1[1].replace(/<[^>]+>/g, '').trim();
      console.log('\n📄 Main Heading:');
      console.log(' ', h1Text);
    }
    
    // Show first paragraph
    const firstP = html.match(/<p[^>]*>(.*?)<\/p>/i);
    if (firstP) {
      const pText = firstP[1].replace(/<[^>]+>/g, '').trim();
      if (pText.length > 0) {
        console.log('\n📖 First Paragraph:');
        console.log(' ', pText.substring(0, 150) + (pText.length > 150 ? '...' : ''));
      }
    }
    
    console.log('\n━'.repeat(60));
    console.log('\n✅ Analysis Complete!\n');
    
    return { title, description, wordCount, readingTime, pageType, sections };
    
  } catch (error) {
    console.error('\n❌ Error fetching URL:', error.message);
    console.log('\n💡 Tip: Make sure the URL is accessible and includes http:// or https://\n');
    throw error;
  }
}

// Main execution
const url = process.argv[2];

if (!url) {
  console.log(`
🌐 URL Analyzer - Analyze any website

Usage: node analyze-url.js <url>

Examples:
  node analyze-url.js https://example.com
  node analyze-url.js https://github.com/nodejs/node
  node analyze-url.js http://info.cern.ch

The script will:
  ✓ Fetch the HTML from the URL
  ✓ Extract title, description, and metadata
  ✓ Count words, images, and links
  ✓ Classify the page type
  ✓ Detect sections (header, nav, footer, etc.)
  ✓ Calculate reading time

💡 Tip: You can also analyze local files with:
   node analyze-html-simple.js your-file.html
  `);
  process.exit(1);
}

// Validate URL
if (!url.startsWith('http://') && !url.startsWith('https://')) {
  console.error('❌ Error: URL must start with http:// or https://');
  console.log('Example: https://example.com');
  process.exit(1);
}

analyzeURL(url)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

