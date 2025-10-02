#!/usr/bin/env node

/**
 * Analyze HTML File - Simple Usage Example
 * 
 * Usage:
 *   node analyze-html.js <path-to-html-file>
 *   node analyze-html.js sample.html
 *   node analyze-html.js https://example.com/page.html
 */

import { readFileSync } from 'fs';
import { ContentExtractor } from './packages/extractor/src/extractor.js';
import { AnalysisOrchestrator } from './packages/analyzer/src/analysis/index.js';

async function analyzeHTML(input) {
  console.log('🚀 Site Generator - HTML Analyzer\n');
  console.log('━'.repeat(60));
  
  let html;
  let url;
  
  // Check if input is a URL or file path
  if (input.startsWith('http://') || input.startsWith('https://')) {
    // It's a URL - fetch it
    console.log('📡 Fetching from URL:', input);
    url = input;
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(input);
    html = await response.text();
    console.log('✅ Fetched successfully!\n');
  } else {
    // It's a file path - read it
    console.log('📄 Reading file:', input);
    url = `file://${input}`;
    html = readFileSync(input, 'utf-8');
    console.log('✅ File loaded successfully!\n');
  }
  
  console.log('━'.repeat(60));
  console.log('\n🔍 Step 1: Extracting Content...\n');
  
  // Step 1: Extract content from HTML
  const extractor = new ContentExtractor();
  const extracted = await extractor.extract(url, html);
  
  console.log('📊 Extraction Results:');
  console.log('  Title:', extracted.title || 'No title found');
  console.log('  Description:', extracted.description || 'No description');
  console.log('  Word Count:', extracted.wordCount);
  console.log('  Reading Time:', extracted.readingTime, 'minutes');
  console.log('  Images:', extracted.images?.length || 0);
  console.log('  Links:', extracted.links?.length || 0);
  
  console.log('\n━'.repeat(60));
  console.log('\n🤖 Step 2: Analyzing Content...\n');
  
  // Step 2: Analyze the content
  const orchestrator = new AnalysisOrchestrator();
  const analysis = await orchestrator.analyzeContent([extracted]);
  
  if (analysis && analysis.length > 0) {
    const result = analysis[0];
    
    console.log('📈 Analysis Results:');
    console.log('\n  🎯 Page Classification:');
    console.log('    Type:', result.classification?.pageType || 'unknown');
    console.log('    Confidence:', (result.classification?.confidence * 100).toFixed(1) + '%');
    
    if (result.metrics) {
      console.log('\n  📊 Content Metrics:');
      console.log('    Quality Score:', result.metrics.qualityScore?.toFixed(1) || 'N/A');
      console.log('    Readability:', result.metrics.readability || 'N/A');
      console.log('    Keyword Count:', result.metrics.keywords?.length || 0);
      
      if (result.metrics.keywords?.length > 0) {
        console.log('    Top Keywords:', result.metrics.keywords.slice(0, 5).join(', '));
      }
    }
    
    if (result.sections && result.sections.length > 0) {
      console.log('\n  🎨 Detected Sections:');
      result.sections.forEach((section, i) => {
        console.log(`    ${i + 1}. ${section.type} (confidence: ${(section.confidence * 100).toFixed(0)}%)`);
      });
    }
    
    console.log('\n  💾 Cache Status:');
    const cacheStats = orchestrator.getCacheStats();
    console.log('    Hits:', cacheStats.hits);
    console.log('    Misses:', cacheStats.misses);
    console.log('    Size:', cacheStats.size);
  }
  
  console.log('\n━'.repeat(60));
  console.log('\n📝 Markdown Output (first 500 chars):\n');
  console.log(extracted.markdown.substring(0, 500) + '...\n');
  
  console.log('━'.repeat(60));
  console.log('✅ Analysis Complete!\n');
  
  // Cleanup
  await orchestrator.destroy();
  
  return { extracted, analysis };
}

// Main execution
const inputFile = process.argv[2];

if (!inputFile) {
  console.log(`
Usage: node analyze-html.js <path-or-url>

Examples:
  node analyze-html.js sample.html
  node analyze-html.js /path/to/page.html
  node analyze-html.js https://example.com/blog/post

The script will:
  1. Extract content from your HTML file
  2. Convert it to Markdown
  3. Classify the page type
  4. Analyze content quality
  5. Detect sections (hero, features, CTA, etc.)
  6. Extract keywords and metadata
  `);
  process.exit(1);
}

analyzeHTML(inputFile)
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });


