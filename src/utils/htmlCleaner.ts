export class HtmlCleaner {
  /**
   * Limpia el HTML recibido de la webhook, eliminando imágenes, fondos y diseños complejos
   * Conserva solo el contenido estructurado: títulos, párrafos, listas y tablas
   */
  static cleanHtmlFromWebhook(html: string): string {
    if (!html) return '';
    
    try {
      // Crear DOM temporal
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // ELIMINAR todas las imágenes
      doc.querySelectorAll('img').forEach(img => img.remove());
      
      // ELIMINAR todos los elementos con background-image o background
      doc.querySelectorAll('*').forEach(el => {
        const element = el as HTMLElement;
        if (element.style.backgroundImage || element.style.background) {
          element.style.backgroundImage = '';
          element.style.background = '';
          element.style.backgroundColor = '';
        }
      });
      
      // ELIMINAR atributos de estilo inline que puedan causar problemas
      doc.querySelectorAll('*').forEach(el => {
        const element = el as HTMLElement;
        // Remover estilos de posicionamiento absoluto
        if (element.style.position === 'absolute' || element.style.position === 'fixed') {
          element.style.position = '';
        }
        // Remover heights/widths fijos problemáticos
        if (element.style.height && element.style.height.includes('px')) {
          element.style.height = '';
        }
      });
      
      // Extraer solo el contenido del body
      const body = doc.body;
      const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'strong', 'em', 'u', 'b', 'i', 'br', 'span', 'div'];
      
      // Extraer contenido limpio
      const cleanContent = this.extractCleanContent(body, allowedTags);
      
      return cleanContent;
    } catch (error) {
      console.error('Error cleaning HTML:', error);
      return html; // Retornar HTML original si hay error
    }
  }
  
  /**
   * Extrae solo el contenido permitido, convirtiendo estructuras complejas en HTML simple
   */
  private static extractCleanContent(element: Element, allowedTags: string[]): string {
    let result = '';
    
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          // Solo agregar párrafo si el texto no está dentro de otro elemento permitido
          result += `<p>${text}</p>`;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        
        if (allowedTags.includes(tagName)) {
          // Conservar etiquetas permitidas pero limpiar sus atributos
          const cleanElement = this.cleanElement(el, allowedTags);
          result += cleanElement;
        } else {
          // Para divs y otros contenedores, extraer su contenido recursivamente
          result += this.extractCleanContent(el, allowedTags);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Limpia un elemento individual, removiendo atributos problemáticos pero conservando la estructura
   */
  private static cleanElement(element: HTMLElement, allowedTags: string[]): string {
    const tagName = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes);
    
    // Para elementos vacíos, no retornar nada
    if (children.length === 0 && !element.textContent?.trim()) {
      return '';
    }
    
    // Construir contenido interno limpio
    let innerContent = '';
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) {
        innerContent += child.textContent || '';
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childEl = child as HTMLElement;
        const childTag = childEl.tagName.toLowerCase();
        if (allowedTags.includes(childTag)) {
          innerContent += this.cleanElement(childEl, allowedTags);
        } else {
          innerContent += this.extractCleanContent(childEl, allowedTags);
        }
      }
    }
    
    // Retornar solo si hay contenido
    if (!innerContent.trim()) {
      return '';
    }
    
    // Preservar solo algunos atributos específicos para tablas
    if (tagName === 'table' || tagName === 'td' || tagName === 'th') {
      return `<${tagName}>${innerContent}</${tagName}>`;
    }
    
    return `<${tagName}>${innerContent}</${tagName}>`;
  }
}
