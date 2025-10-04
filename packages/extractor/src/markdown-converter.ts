import TurndownService from 'turndown';
import * as cheerio from 'cheerio';
import { logger } from '@site-generator/core';
import { ExtractionOptions } from './extractor';

export class MarkdownConverter {
  private turndownService: TurndownService;

  constructor(private options: ExtractionOptions) {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });

    this.configureTurndown();
  }

  /**
   * Convert HTML to Markdown
   */
  convert(html: string): string {
    try {
      let cleanedHtml = this.preprocessHtml(html);
      const markdown = this.turndownService.turndown(cleanedHtml);
      return this.postprocessMarkdown(markdown);
    } catch (error) {
      logger.error('Failed to convert HTML to Markdown', error instanceof Error ? error : new Error(String(error)));
      return '<!-- Conversion failed -->';
    }
  }

  /**
   * Convert Markdown back to HTML
   */
  toHtml(markdown: string): string {
    // This is a simplified implementation
    // In a real implementation, you'd use a proper markdown parser
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img alt="$1" src="$2">')
      .replace(/\[([^\]]*)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');
  }

  private preprocessHtml(html: string): string {
    const $ = cheerio.load(html);

    // Handle code blocks
    $('pre code').each((_, codeElement) => {
      const $code = $(codeElement);
      const language = $code.attr('class')?.replace('language-', '') || 'text';
      $code.wrap(`<pre data-language="${language}"></pre>`);
    });

    // Handle images
    $('img').each((_, imgElement) => {
      const $img = $(imgElement);
      const alt = $img.attr('alt') || '';
      const title = $img.attr('title') || '';
      $img.attr('data-alt', alt);
      $img.attr('data-title', title);
    });

    // Handle links
    $('a').each((_, linkElement) => {
      const $link = $(linkElement);
      const title = $link.attr('title') || '';
      if (title) {
        $link.attr('data-title', title);
      }
    });

    // Remove unwanted elements
    if (this.options.extractImages === false) {
      $('img').remove();
    }

    if (this.options.extractLinks === false) {
      $('a').remove();
    }

    return $.html();
  }

  private postprocessMarkdown(markdown: string): string {
    let processed = markdown;

    // Clean up extra whitespace
    processed = processed.replace(/\n{3,}/g, '\n\n');

    // Fix list spacing
    processed = processed.replace(/(\n- .+)\n\n/g, '$1\n');

    // Fix code block formatting
    processed = processed.replace(/```(\w+)?\n\n/g, '```$1\n');

    // Ensure single line breaks in lists
    processed = processed.replace(/(\n- .+)\n(?!-)/g, '$1\n\n');

    // Limit content length if specified
    if (this.options.maxContentLength && processed.length > this.options.maxContentLength) {
      processed = processed.substring(0, this.options.maxContentLength) + '\n\n<!-- Content truncated -->';
    }

    return processed.trim();
  }

  private configureTurndown(): void {
    // Custom rules for better conversion

    // Handle tables
    this.turndownService.addRule('tables', {
      filter: 'table',
      replacement: (content, node) => {
        // Let default table handling work
        return content;
      }
    });

    // Handle code blocks with language
    this.turndownService.addRule('codeBlocks', {
      filter: (node) => {
        return node.nodeName === 'PRE' && node.firstChild?.nodeName === 'CODE';
      },
      replacement: (content, node) => {
        const codeElement = node.firstChild as Element;
        const language = codeElement.getAttribute('class')?.replace('language-', '') || '';
        return `\`\`\`${language}\n${content}\n\`\`\``;
      }
    });

    // Handle images with alt text
    this.turndownService.addRule('images', {
      filter: 'img',
      replacement: (content, node) => {
        const element = node as Element;
        const alt = element.getAttribute('alt') || '';
        const src = element.getAttribute('src') || '';
        const title = element.getAttribute('title') || '';

        if (alt) {
          if (title) {
            return `![${alt}](${src} "${title}")`;
          } else {
            return `![${alt}](${src})`;
          }
        } else {
          return `![image](${src})`;
        }
      }
    });

    // Handle headings
    this.turndownService.addRule('headings', {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      replacement: (content, node) => {
        const level = parseInt(node.nodeName.charAt(1));
        return `${'#'.repeat(level)} ${content}`;
      }
    });
  }
}
