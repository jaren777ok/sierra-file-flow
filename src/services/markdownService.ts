import { marked } from 'marked';

// Configure marked with GFM (GitHub Flavored Markdown) for tables, etc.
marked.setOptions({
  gfm: true,        // GitHub Flavored Markdown (tables, strikethrough, etc.)
  breaks: true,     // Convert \n to <br>
});

/**
 * Converts Markdown content to HTML
 * Handles escaped newlines (\n literals), GFM tables, lists, headings, etc.
 */
export const markdownToHtml = (markdown: string): string => {
  if (!markdown || typeof markdown !== 'string') {
    return '<p>No hay contenido disponible.</p>';
  }

  // Step 1: Clean escaped characters - ORDER MATTERS!
  let cleaned = markdown
    // First: Replace double-escaped newlines (\\n -> \n literal, then to real newline)
    .replace(/\\\\n/g, '\n')
    // Then: Replace single-escaped newlines (\n -> real newline)
    .replace(/\\n/g, '\n')
    // Replace escaped quotes
    .replace(/\\"/g, '"')
    // Replace remaining escaped backslashes
    .replace(/\\\\/g, '\\');

  // Step 2: Clean any HTML wrapper if present (for backwards compatibility)
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1].trim();
  } else {
    cleaned = cleaned
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<\/?body[^>]*>/gi, '')
      .trim();
  }

  // Step 3: ALWAYS convert Markdown to HTML using marked
  // Removed the "already HTML" detection that was incorrectly skipping conversion
  try {
    const html = marked.parse(cleaned);
    
    // Clean up the result - marked returns a string but TypeScript thinks it could be Promise
    const result = typeof html === 'string' ? html : '';
    
    // Remove unnecessary whitespace between tags
    return result.replace(/>\s*\n\s*</g, '><').trim();
  } catch (error) {
    console.error('Error parsing markdown:', error);
    // Fallback: wrap in paragraph if conversion fails
    return `<p>${cleaned.replace(/\n/g, '<br>')}</p>`;
  }
};

/**
 * Checks if content appears to be Markdown
 */
export const isMarkdownContent = (content: string): boolean => {
  if (!content) return false;
  
  // Common Markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m,           // Headings
    /\*\*[^*]+\*\*/,        // Bold
    /\*[^*]+\*/,            // Italic
    /^\s*[-*+]\s/m,         // Unordered lists
    /^\s*\d+\.\s/m,         // Ordered lists
    /\|[^|]+\|/,            // Tables
    /^\s*>/m,               // Blockquotes
    /`[^`]+`/,              // Inline code
    /```[\s\S]*?```/,       // Code blocks
    /\[([^\]]+)\]\([^)]+\)/ // Links
  ];
  
  return markdownPatterns.some(pattern => pattern.test(content));
};
