export class HtmlToDocumentService {
  /**
   * Parse webhook response and extract HTML content
   * Expected format: [{"EXITO": "<!DOCTYPE HTML>..."}]
   */
  static parseWebhookResponse(response: any): string {
    try {
      console.log('🔍 Parsing webhook response...');
      
      if (Array.isArray(response) && response.length > 0 && response[0]?.EXITO) {
        console.log('✅ Found EXITO field in response');
        return response[0].EXITO;
      }
      
      // If response is already a string
      if (typeof response === 'string') {
        console.log('✅ Response is already a string');
        return response;
      }
      
      console.warn('⚠️ Unexpected response format');
      return '';
    } catch (error) {
      console.error('❌ Error parsing webhook response:', error);
      return '';
    }
  }

  /**
   * Clean HTML by removing DOCTYPE, html, head tags
   * PRESERVE all body content with formatting
   */
  static cleanHtml(html: string): string {
    try {
      if (!html) return '';
      
      console.log('🧹 Cleaning HTML, length:', html.length);
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Get body content only - this preserves all HTML structure
      const bodyContent = doc.body.innerHTML || html;
      
      console.log('✅ HTML cleaned, new length:', bodyContent.length);
      
      return bodyContent;
    } catch (error) {
      console.error('❌ Error cleaning HTML:', error);
      return html;
    }
  }

  /**
   * Convert HTML to plain text while preserving some formatting
   */
  static htmlToText(html: string): string {
    try {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent || div.innerText || '';
    } catch (error) {
      console.error('Error converting HTML to text:', error);
      return '';
    }
  }

  /**
   * Split HTML content into pages for A4 portrait format
   * Improved algorithm with accurate height estimation
   */
  static splitIntoPages(content: string): string[] {
    if (!content) return ['<p>No hay contenido para mostrar.</p>'];
    
    const div = document.createElement('div');
    div.innerHTML = content;
    
    const pages: string[] = [];
    let currentPage = '';
    let currentHeight = 0;
    
    // A4 portrait: 297mm height
    // With padding: 80px top + 60px bottom = 140px
    // Content area: ~700px usable height (conservative estimate)
    const MAX_HEIGHT = 700;
    
    const children = Array.from(div.children);
    
    for (const child of children) {
      const elementHTML = child.outerHTML;
      
      // More accurate height estimation
      let estimatedHeight = 40; // Default
      
      if (child.tagName === 'H1') {
        estimatedHeight = 70;
      } else if (child.tagName === 'H2') {
        estimatedHeight = 60;
      } else if (child.tagName === 'H3') {
        estimatedHeight = 50;
      } else if (child.tagName === 'HR') {
        estimatedHeight = 25;
      } else if (child.tagName === 'P') {
        const textLength = (child.textContent || '').length;
        // 11pt font, ~120 chars per line, ~22px per line
        const lines = Math.ceil(textLength / 120);
        estimatedHeight = lines * 22 + 16; // +16 for margins
      } else if (child.tagName === 'UL' || child.tagName === 'OL') {
        const items = child.querySelectorAll('li').length;
        estimatedHeight = items * 25 + 30; // ~25px per item + list margins
      } else if (child.tagName === 'TABLE') {
        const rows = child.querySelectorAll('tr').length;
        estimatedHeight = rows * 35 + 50; // ~35px per row + table margins
      }
      
      // Check if element is a large block that shouldn't be split
      const isLargeBlock = ['TABLE', 'UL', 'OL'].includes(child.tagName);
      
      // If adding this element exceeds page height
      if (currentHeight + estimatedHeight > MAX_HEIGHT && currentPage) {
        // For large blocks, if they're too big for remaining space
        // but can fit on a new page, put them on a new page
        if (isLargeBlock && estimatedHeight > MAX_HEIGHT * 0.7) {
          // Element is very large, give it its own page
          pages.push(currentPage);
          pages.push(elementHTML);
          currentPage = '';
          currentHeight = 0;
        } else {
          // Normal case: start new page with this element
          pages.push(currentPage);
          currentPage = elementHTML;
          currentHeight = estimatedHeight;
        }
      } else {
        currentPage += elementHTML;
        currentHeight += estimatedHeight;
      }
    }
    
    // Add the last page if there's content
    if (currentPage) {
      pages.push(currentPage);
    }
    
    console.log('📄 Content split into', pages.length, 'pages');
    
    return pages.length > 0 ? pages : [content];
  }

  /**
   * Split content into slides for PPT
   */
  static splitIntoSlides(content: string): string[] {
    try {
      const div = document.createElement('div');
      div.innerHTML = content;
      
      const slides: string[] = [];
      const headings = div.querySelectorAll('h1, h2, h3');
      
      if (headings.length === 0) {
        // No headings, split by paragraphs (3 per slide)
        const paragraphs = Array.from(div.querySelectorAll('p, ul, ol, table'));
        for (let i = 0; i < paragraphs.length; i += 3) {
          const slideContent = paragraphs
            .slice(i, i + 3)
            .map(p => p.outerHTML)
            .join('');
          if (slideContent.trim()) {
            slides.push(slideContent);
          }
        }
      } else {
        // Split by headings
        let currentSlide = '';
        const children = Array.from(div.children);
        
        children.forEach(child => {
          if (child.matches('h1, h2, h3')) {
            if (currentSlide.trim()) {
              slides.push(currentSlide);
            }
            currentSlide = child.outerHTML;
          } else {
            currentSlide += child.outerHTML;
          }
        });
        
        if (currentSlide.trim()) {
          slides.push(currentSlide);
        }
      }
      
      return slides.length > 0 ? slides : [content];
    } catch (error) {
      console.error('Error splitting into slides:', error);
      return [content];
    }
  }
}
