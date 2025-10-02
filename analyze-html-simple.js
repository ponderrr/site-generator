#!/usr/bin/env node

/**
 * Simple HTML Analyzer
 * 
 * Usage: node analyze-html-simple.js sample.html
 */

import { readFileSync } from 'fs';

async function analyzeHTML(filePath) {
  console.log('🚀 Site Generator - HTML Analyzer\n');
  
  // Read the HTML file
  console.log('📄 Reading file:', filePath);
  const html = readFileSync(filePath, 'utf-8');
  console.log('✅ File loaded!\n');
  
  console.log('━'.repeat(60));
  console.log('\n📊 HTML File Analysis:\n');
  
  // Extract basic information
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : 'No title found';
  
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  const description = descMatch ? descMatch[1] : 'No description';
  
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const pMatches = html.match(/<p[^>]*>(.*?)<\/p>/gi) || [];
  
  // Count words (rough estimate)
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const wordCount = textContent.split(' ').filter(w => w.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // Avg reading speed 200 words/min
  
  // Detect sections
  const hasNav = /<nav[^>]*>/i.test(html);
  const hasArticle = /<article[^>]*>/i.test(html);
  const hasHeader = /<header[^>]*>/i.test(html);
  const hasFooter = /<footer[^>]*>/i.test(html);
  const hasForm = /<form[^>]*>/i.test(html);
  const hasCTA = /subscribe|sign up|get started|buy now|learn more/i.test(html);
  
  console.log('📝 Content Summary:');
  console.log('  Title:', title);
  console.log('  Description:', description);
  console.log('  Word Count:', wordCount);
  console.log('  Reading Time:', readingTime, 'minutes');
  console.log('  H1 Headings:', h1Matches.length);
  console.log('  H2 Headings:', h2Matches.length);
  console.log('  Paragraphs:', pMatches.length);
  
  console.log('\n🎯 Page Classification:');
  let pageType = 'unknown';
  let confidence = 'low';
  
  if (hasArticle && h1Matches.length > 0 && pMatches.length > 5) {
    pageType = 'blog-post';
    confidence = 'high';
  } else if (hasNav && hasHeader && hasFooter && hasCTA) {
    pageType = 'landing-page';
    confidence = 'medium';
  } else if (hasForm && hasCTA) {
    pageType = 'contact-or-signup';
    confidence = 'medium';
  }
  
  console.log('  Type:', pageType);
  console.log('  Confidence:', confidence);
  
  console.log('\n🎨 Detected Sections:');
  if (hasHeader) console.log('  ✓ Header');
  if (hasNav) console.log('  ✓ Navigation');
  if (hasArticle) console.log('  ✓ Article/Main Content');
  if (hasForm) console.log('  ✓ Form');
  if (hasCTA) console.log('  ✓ Call-to-Action');
  if (hasFooter) console.log('  ✓ Footer');
  
  console.log('\n━'.repeat(60));
  console.log('\n✅ Analysis Complete!\n');
  
  console.log('💡 To use the full analyzer with all features:');
  console.log('   1. Make sure project is built: pnpm build');
  console.log('   2. Use the test suite: pnpm test');
  console.log('   3. Or integrate into your own code (see examples below)\n');
}

// Main
const filePath = process.argv[2];

if (!filePath) {
  console.log(`
Usage: node analyze-html-simple.js <html-file>

Example:
  node analyze-html-simple.js sample.html

This is a simplified version. For full analysis, see:
  - analyze-html.js (full version)
  - TESTING-GUIDE.md (complete documentation)
  `);
  process.exit(1);
}

analyzeHTML(filePath).catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});


