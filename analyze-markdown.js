#!/usr/bin/env node

/**
 * Analyze Markdown Files - GitHub Flavored Markdown Support
 * 
 * Usage: node analyze-markdown.js <markdown-file>
 * Example: node analyze-markdown.js README.md
 */

import { readFileSync } from 'fs';
import { extname } from 'path';

function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const result = {
    title: '',
    headings: [],
    paragraphs: [],
    links: [],
    images: [],
    codeBlocks: [],
    lists: [],
    tables: [],
    wordCount: 0,
    readingTime: 0
  };
  
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let currentCodeBlock = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLanguage = line.substring(3).trim();
        currentCodeBlock = [];
      } else {
        inCodeBlock = false;
        result.codeBlocks.push({
          language: codeBlockLanguage,
          content: currentCodeBlock.join('\n'),
          lines: currentCodeBlock.length
        });
        currentCodeBlock = [];
      }
      continue;
    }
    
    if (inCodeBlock) {
      currentCodeBlock.push(line);
      continue;
    }
    
    // Extract title (first H1)
    if (line.startsWith('# ') && !result.title) {
      result.title = line.substring(2).trim();
    }
    
    // Extract headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      result.headings.push({
        level: headingMatch[1].length,
        text: headingMatch[2].trim()
      });
    }
    
    // Extract paragraphs (non-empty lines that aren't headings, lists, or code)
    if (line.trim() && 
        !line.startsWith('#') && 
        !line.startsWith('-') && 
        !line.startsWith('*') && 
        !line.startsWith('+') && 
        !line.match(/^\d+\./) &&
        !line.startsWith('|') &&
        !line.startsWith('```')) {
      result.paragraphs.push(line.trim());
    }
    
    // Extract links
    const linkMatches = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (linkMatches) {
      linkMatches.forEach(link => {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          result.links.push({
            text: match[1],
            url: match[2]
          });
        }
      });
    }
    
    // Extract images
    const imageMatches = line.match(/!\[([^\]]*)\]\(([^)]+)\)/g);
    if (imageMatches) {
      imageMatches.forEach(img => {
        const match = img.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (match) {
          result.images.push({
            alt: match[1],
            src: match[2]
          });
        }
      });
    }
    
    // Extract lists
    if (line.match(/^[-*+]\s+/) || line.match(/^\d+\.\s+/)) {
      result.lists.push(line.trim());
    }
    
    // Extract tables
    if (line.includes('|')) {
      result.tables.push(line.trim());
    }
  }
  
  // Calculate word count and reading time
  const textContent = markdown
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
    .replace(/^#{1,6}\s+/gm, '') // Remove heading markers
    .replace(/^[-*+]\s+/gm, '') // Remove list markers
    .replace(/^\d+\.\s+/gm, '') // Remove numbered list markers
    .replace(/^\|.*\|$/gm, '') // Remove table rows
    .replace(/\s+/g, ' ')
    .trim();
  
  result.wordCount = textContent.split(' ').filter(w => w.length > 0).length;
  result.readingTime = Math.ceil(result.wordCount / 200); // 200 words per minute
  
  return result;
}

function classifyMarkdown(markdown, filename) {
  const content = markdown.toLowerCase();
  const filenameLower = filename.toLowerCase();
  
  // Classification logic
  if (filenameLower.includes('readme') || content.includes('# readme')) {
    return { type: 'readme', confidence: 0.95 };
  }
  
  if (filenameLower.includes('changelog') || content.includes('# changelog')) {
    return { type: 'changelog', confidence: 0.90 };
  }
  
  if (filenameLower.includes('contributing') || content.includes('# contributing')) {
    return { type: 'contributing', confidence: 0.90 };
  }
  
  if (content.includes('tutorial') || content.includes('guide') || content.includes('how to')) {
    return { type: 'tutorial', confidence: 0.85 };
  }
  
  if (content.includes('api') || content.includes('reference') || content.includes('endpoint')) {
    return { type: 'api-docs', confidence: 0.85 };
  }
  
  if (content.includes('documentation') || content.includes('docs')) {
    return { type: 'documentation', confidence: 0.90 };
  }
  
  if (content.includes('blog') || content.includes('post') || content.includes('article')) {
    return { type: 'blog-post', confidence: 0.80 };
  }
  
  return { type: 'general', confidence: 0.70 };
}

async function analyzeMarkdown(filePath) {
  console.log('🚀 Site Generator - Markdown Analyzer');
  console.log('\n━'.repeat(60));
  console.log('\n📄 Reading Markdown file:', filePath);
  
  try {
    const markdown = readFileSync(filePath, 'utf-8');
    console.log('✅ File loaded successfully!');
    console.log('📏 File Size:', (markdown.length / 1024).toFixed(2), 'KB\n');
    
    console.log('━'.repeat(60));
    console.log('\n📊 Analyzing Markdown Content...\n');
    
    const parsed = parseMarkdown(markdown);
    const classification = classifyMarkdown(markdown, filePath);
    
    // Display results
    console.log('📝 Document Information:');
    console.log('  File:', filePath);
    console.log('  Title:', parsed.title || 'No title found');
    console.log('  Type:', classification.type);
    console.log('  Confidence:', (classification.confidence * 100).toFixed(1) + '%');
    
    console.log('\n📈 Content Metrics:');
    console.log('  Word Count:', parsed.wordCount.toLocaleString());
    console.log('  Reading Time:', parsed.readingTime, 'minutes');
    console.log('  Total Headings:', parsed.headings.length);
    console.log('  Paragraphs:', parsed.paragraphs.length);
    console.log('  Code Blocks:', parsed.codeBlocks.length);
    console.log('  Images:', parsed.images.length);
    console.log('  Links:', parsed.links.length);
    console.log('  Lists:', parsed.lists.length);
    console.log('  Tables:', parsed.tables.length);
    
    if (parsed.headings.length > 0) {
      console.log('\n📋 Document Structure:');
      parsed.headings.forEach((heading, i) => {
        const indent = '  '.repeat(heading.level - 1);
        console.log(`  ${indent}H${heading.level}: ${heading.text}`);
      });
    }
    
    if (parsed.codeBlocks.length > 0) {
      console.log('\n💻 Code Blocks:');
      parsed.codeBlocks.forEach((block, i) => {
        console.log(`  ${i + 1}. ${block.language || 'plain'} (${block.lines} lines)`);
      });
    }
    
    if (parsed.links.length > 0) {
      console.log('\n🔗 External Links:');
      parsed.links.slice(0, 5).forEach((link, i) => {
        console.log(`  ${i + 1}. ${link.text} → ${link.url}`);
      });
      if (parsed.links.length > 5) {
        console.log(`  ... and ${parsed.links.length - 5} more`);
      }
    }
    
    if (parsed.images.length > 0) {
      console.log('\n🖼️  Images:');
      parsed.images.forEach((img, i) => {
        console.log(`  ${i + 1}. ${img.alt || 'No alt text'} → ${img.src}`);
      });
    }
    
    // Show first paragraph as preview
    if (parsed.paragraphs.length > 0) {
      console.log('\n📖 Content Preview:');
      const firstParagraph = parsed.paragraphs[0];
      console.log(' ', firstParagraph.substring(0, 200) + (firstParagraph.length > 200 ? '...' : ''));
    }
    
    console.log('\n━'.repeat(60));
    console.log('\n✅ Markdown Analysis Complete!\n');
    
    return { parsed, classification };
    
  } catch (error) {
    console.error('\n❌ Error reading file:', error.message);
    console.log('\n💡 Make sure the file exists and is readable\n');
    throw error;
  }
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.log(`
📝 Markdown Analyzer - Analyze GitHub Flavored Markdown

Usage: node analyze-markdown.js <markdown-file>

Examples:
  node analyze-markdown.js README.md
  node analyze-markdown.js docs/tutorial.md
  node analyze-markdown.js CHANGELOG.md
  node analyze-markdown.js CONTRIBUTING.md

Supported Markdown Features:
  ✓ Headings (H1-H6)
  ✓ Paragraphs and text
  ✓ Links and images
  ✓ Code blocks (with language detection)
  ✓ Lists (bulleted and numbered)
  ✓ Tables
  ✓ GitHub Flavored Markdown

The analyzer will:
  ✓ Extract document structure
  ✓ Count words and estimate reading time
  ✓ Classify document type (README, docs, tutorial, etc.)
  ✓ Identify code blocks and their languages
  ✓ Extract all links and images
  ✓ Show document outline
  `);
  process.exit(1);
}

// Check if file exists and has markdown extension
if (!filePath.toLowerCase().endsWith('.md') && !filePath.toLowerCase().endsWith('.markdown')) {
  console.log('⚠️  Warning: File doesn\'t have .md or .markdown extension');
  console.log('   Continuing anyway...\n');
}

analyzeMarkdown(filePath)
  .then(() => {
    console.log('🎉 Analysis complete!');
    process.exit(0);
  })
  .catch(() => process.exit(1));
