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
   * Split content into pages based on logical sections and approximate height
   * Each A4 page is ~297mm tall, with ~200mm usable content area
   */
  static splitIntoPages(content: string): string[] {
    if (!content) return [''];

    const div = document.createElement('div');
    div.innerHTML = content;
    
    const pages: string[] = [];
    let currentPage = '';
    let currentHeight = 0;
    const MAX_HEIGHT = 900; // Approximate px for A4 page content area

    const children = Array.from(div.children);
    
    for (const child of children) {
      const elementHTML = child.outerHTML;
      
      // Estimate height based on element type
      let estimatedHeight = 50;
      if (child.tagName === 'H1') estimatedHeight = 80;
      else if (child.tagName === 'H2') estimatedHeight = 70;
      else if (child.tagName === 'H3') estimatedHeight = 60;
      else if (child.tagName === 'TABLE') estimatedHeight = 200;
      else if (child.tagName === 'UL' || child.tagName === 'OL') {
        const items = child.querySelectorAll('li').length;
        estimatedHeight = items * 40;
      }
      else if (child.tagName === 'P') {
        const textLength = (child.textContent || '').length;
        estimatedHeight = Math.ceil(textLength / 100) * 30;
      }

      // Start new page if content would overflow
      if (currentHeight + estimatedHeight > MAX_HEIGHT && currentPage) {
        pages.push(currentPage);
        currentPage = elementHTML;
        currentHeight = estimatedHeight;
      } else {
        currentPage += elementHTML;
        currentHeight += estimatedHeight;
      }
    }
    
    // Add final page
    if (currentPage) {
      pages.push(currentPage);
    }
    
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
