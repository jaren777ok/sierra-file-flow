export class HtmlToDocumentService {
  /**
   * Parse webhook response and extract HTML content
   * Expected format: [{"EXITO": "<!DOCTYPE HTML>..."}]
   */
  static parseWebhookResponse(response: any): string {
    try {
      if (Array.isArray(response) && response.length > 0 && response[0]?.EXITO) {
        return response[0].EXITO;
      }
      
      // If response is already a string
      if (typeof response === 'string') {
        return response;
      }
      
      return '';
    } catch (error) {
      console.error('Error parsing webhook response:', error);
      return '';
    }
  }

  /**
   * Clean HTML by removing DOCTYPE, html, head, body tags
   * Keep only formatted content
   */
  static cleanHtml(html: string): string {
    try {
      if (!html) return '';
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Get body content only
      return doc.body.innerHTML || html;
    } catch (error) {
      console.error('Error cleaning HTML:', error);
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
   * Split content into pages based on height
   */
  static splitIntoPages(content: string, maxHeight: number = 1000): string[] {
    // For now, return single page - can be enhanced later
    return [content];
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
