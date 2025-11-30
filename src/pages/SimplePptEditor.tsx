import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Download, RefreshCw, Presentation, Save, Trash2, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PptxGenJS from 'pptxgenjs';
import portadaImage from '@/assets/presentacion_1_2.png';
import graciasImage from '@/assets/presentacion_1_3.png';

// 16:9 HD dimensions (standard presentation format)
const SLIDE_WIDTH = 1280;  // 16:9 HD width
const SLIDE_HEIGHT = 720;  // 16:9 HD height
const PADDING = 50;        // Adjusted for 16:9 proportion
const SAFETY_MARGIN = 90;  // Adjusted for 16:9 proportion
const CONTENT_HEIGHT = SLIDE_HEIGHT - (PADDING * 2); // 620px
const EFFECTIVE_HEIGHT = CONTENT_HEIGHT - SAFETY_MARGIN; // 530px
const MIN_CONTENT_WITH_TITLE = 70; // Mínimo contenido que debe acompañar a un título

// Helper para verificar si un elemento es un título
const isHeading = (tagName: string): boolean => {
  return ['h1', 'h2', 'h3', 'h4'].includes(tagName);
};

// Convert image to base64 for PPTX export
const imageToBase64 = (imgSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imgSrc;
  });
};

// Calculate text height based on content length and available width (in inches) - CONSERVATIVE VERSION
const calculateTextHeight = (text: string, fontSize: number, widthInches: number): number => {
  // PowerPoint uses ~72 points per inch
  // More conservative character width estimation
  const avgCharWidthPt = fontSize * 0.55; // More conservative (was 0.5)
  const charsPerInch = 72 / avgCharWidthPt;
  const charsPerLine = Math.max(10, Math.floor(widthInches * charsPerInch * 0.85)); // 85% margin of error
  
  // Calculate lines using word wrapping
  const words = text.split(/\s+/);
  let lineCount = 1;
  let currentLineLength = 0;
  
  for (const word of words) {
    if (currentLineLength + word.length + 1 > charsPerLine) {
      lineCount++;
      currentLineLength = word.length;
    } else {
      currentLineLength += word.length + 1;
    }
  }
  
  // Height per line with generous line spacing
  const lineHeight = (fontSize / 72) * 1.6; // 1.6 line spacing (more space)
  
  return Math.max(lineCount * lineHeight + 0.1, 0.4); // Minimum 0.4"
};

// Clean HTML from webhook response
const cleanHtml = (rawHtml: string): string => {
  let cleaned = rawHtml.replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/\\"/g, '"');
  
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
  
  cleaned = cleaned.replace(/>\s*\n\s*</g, '><');
  
  return cleaned;
};

// Apply inline styles for copying to Word/Google Docs
const applyInlineStylesForCopy = (element: HTMLElement): HTMLElement => {
  const clone = element.cloneNode(true) as HTMLElement;
  
  clone.querySelectorAll('table').forEach(table => {
    table.setAttribute('style', 'width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10pt;');
  });
  
  clone.querySelectorAll('th').forEach(th => {
    th.setAttribute('style', 'border: 1px solid #000; padding: 6pt 8pt; text-align: left; background-color: #f0f0f0; font-weight: 700;');
  });
  
  clone.querySelectorAll('td').forEach(td => {
    td.setAttribute('style', 'border: 1px solid #000; padding: 6pt 8pt; text-align: left;');
  });
  
  clone.querySelectorAll('h1').forEach(h1 => {
    h1.setAttribute('style', 'font-size: 22pt; font-weight: 800; text-align: center; margin: 16pt 0 12pt 0;');
  });
  
  clone.querySelectorAll('h2').forEach(h2 => {
    h2.setAttribute('style', 'font-size: 16pt; font-weight: 700; margin: 14pt 0 8pt 0; text-transform: uppercase;');
  });
  
  clone.querySelectorAll('h3').forEach(h3 => {
    h3.setAttribute('style', 'font-size: 14pt; font-weight: 700; margin: 10pt 0 6pt 0;');
  });
  
  clone.querySelectorAll('p').forEach(p => {
    p.setAttribute('style', 'margin-bottom: 8pt; text-align: justify; line-height: 1.4; font-size: 12pt;');
  });
  
  clone.querySelectorAll('ul').forEach(ul => {
    ul.setAttribute('style', 'margin: 8pt 0; padding-left: 20pt; list-style-type: disc;');
  });
  
  clone.querySelectorAll('ol').forEach(ol => {
    ol.setAttribute('style', 'margin: 8pt 0; padding-left: 20pt; list-style-type: decimal;');
  });
  
  clone.querySelectorAll('li').forEach(li => {
    li.setAttribute('style', 'margin-bottom: 4pt; line-height: 1.4; font-size: 12pt;');
  });
  
  clone.querySelectorAll('strong, b').forEach(el => {
    el.setAttribute('style', 'font-weight: 700;');
  });
  
  return clone;
};

// Check if HTML content is effectively empty
const isSlideEmpty = (html: string): boolean => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const text = temp.textContent || temp.innerText || '';
  return text.trim().length === 0;
};

export default function SimplePptEditor() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [slidesContent, setSlidesContent] = useState<string[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const slidesContainerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Divide content into slides based on element heights - OPTIMIZED to fill available space
  const divideContentIntoSlides = useCallback((html: string): string[] => {
    const slides: string[] = [];
    
    // Create temporary container to measure elements
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: ${SLIDE_WIDTH - (PADDING * 2)}px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    `;
    tempContainer.className = 'slide-content';
    tempContainer.innerHTML = html;
    document.body.appendChild(tempContainer);

    let currentSlideHtml = '';
    let currentHeight = 0;
    
    // Espacio mínimo que debe quedar después de un título para contenido
    const MIN_SPACE_FOR_CONTENT = 130; // Adjusted for 16:9
    
    // Helper to save current slide and reset
    const saveCurrentSlide = () => {
      if (currentSlideHtml !== '') {
        slides.push(currentSlideHtml);
        currentSlideHtml = '';
        currentHeight = 0;
      }
    };
    
    // Get all block-level children
    const children = Array.from(tempContainer.children);
    
    for (let i = 0; i < children.length; i++) {
      const element = children[i] as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      const elementHeight = element.getBoundingClientRect().height;
      
      // CASE 1: Element fits completely in current slide
      if (currentHeight + elementHeight <= EFFECTIVE_HEIGHT) {
        // Si es un título, verificar que quede espacio suficiente para contenido siguiente
        if (isHeading(tagName)) {
          const spaceAfterTitle = EFFECTIVE_HEIGHT - (currentHeight + elementHeight);
          const nextElement = children[i + 1] as HTMLElement | undefined;
          
          // Si hay siguiente elemento y el espacio restante es limitado
          if (nextElement && spaceAfterTitle < MIN_SPACE_FOR_CONTENT) {
            const nextTagName = nextElement.tagName.toLowerCase();
            
            // Calcular cuánto espacio mínimo necesita el siguiente elemento
            let minNextSpace = MIN_SPACE_FOR_CONTENT;
            
            if (nextTagName === 'ul' || nextTagName === 'ol') {
              // Para listas, calcular altura del primer item
              const firstItem = nextElement.querySelector(':scope > li') as HTMLElement;
              if (firstItem) {
                minNextSpace = firstItem.getBoundingClientRect().height;
              }
            } else if (nextTagName === 'table') {
              // Para tablas, calcular altura de primera fila
              const firstRow = nextElement.querySelector('tbody tr, :scope > tr') as HTMLElement;
              const thead = nextElement.querySelector('thead') as HTMLElement;
              if (firstRow) {
                minNextSpace = firstRow.getBoundingClientRect().height + (thead?.getBoundingClientRect().height || 0);
              }
            } else if (!isHeading(nextTagName)) {
              // Para párrafos u otros elementos, usar su altura o mínimo
              minNextSpace = Math.min(nextElement.getBoundingClientRect().height, MIN_SPACE_FOR_CONTENT);
            }
            
            // Si NO hay espacio suficiente para el mínimo requerido, mover título a nuevo slide
            if (spaceAfterTitle < minNextSpace) {
              saveCurrentSlide();
              currentSlideHtml = element.outerHTML;
              currentHeight = elementHeight;
              continue;
            }
          }
        }
        
        // Comportamiento normal: agregar elemento
        currentSlideHtml += element.outerHTML;
        currentHeight += elementHeight;
        continue;
      }
      
      // CASE 2: Element is a list (ul/ol) - divide by items, filling current space first
      if (tagName === 'ul' || tagName === 'ol') {
        const listItems = Array.from(element.querySelectorAll(':scope > li'));
        let listHtml = `<${tagName}>`;
        let listHeight = 0;
        let availableHeight = EFFECTIVE_HEIGHT - currentHeight;
        let itemsInCurrentSlide = 0;
        
        // Si el slide actual tiene un título, asegurar al menos 2 items con él
        const currentSlideHasHeading = /<h[1-4][^>]*>/.test(currentSlideHtml);
        const minItemsWithHeading = currentSlideHasHeading ? 2 : 0;
        
        for (let j = 0; j < listItems.length; j++) {
          const liElement = listItems[j] as HTMLElement;
          const liHeight = liElement.getBoundingClientRect().height;
          
          // If this item won't fit in available space
          if (listHeight + liHeight > availableHeight) {
            // Si tenemos título y pocos items, verificar si podemos forzar SIN exceder límite absoluto
            if (currentSlideHasHeading && itemsInCurrentSlide < minItemsWithHeading) {
              const totalHeightWithItem = currentHeight + listHeight + liHeight;
              // Solo forzar si el TOTAL no excede EFFECTIVE_HEIGHT
              if (totalHeightWithItem <= EFFECTIVE_HEIGHT) {
                listHtml += liElement.outerHTML;
                listHeight += liHeight;
                itemsInCurrentSlide++;
                continue;
              }
              // Si excede, NO forzar - continuar con división normal
            }
            
            // Si hay items acumulados, cerrar lista y guardar slide
            if (listHtml !== `<${tagName}>`) {
              currentSlideHtml += listHtml + `</${tagName}>`;
              saveCurrentSlide();
              listHtml = `<${tagName}>`;
              listHeight = 0;
              itemsInCurrentSlide = 0;
              availableHeight = EFFECTIVE_HEIGHT;
            } else if (currentSlideHtml !== '') {
              saveCurrentSlide();
              availableHeight = EFFECTIVE_HEIGHT;
            }
          }
          
          listHtml += liElement.outerHTML;
          listHeight += liHeight;
          itemsInCurrentSlide++;
        }
        
        // Add remaining list items to current slide
        if (listHtml !== `<${tagName}>`) {
          currentSlideHtml += listHtml + `</${tagName}>`;
          currentHeight += listHeight;
        }
        continue;
      }
      
      // CASE 3: Element is a table - divide by rows, filling current space first
      if (tagName === 'table') {
        const thead = element.querySelector('thead');
        const tbody = element.querySelector('tbody');
        const rows = Array.from(tbody ? tbody.querySelectorAll('tr') : element.querySelectorAll(':scope > tr'));
        const theadHtml = thead ? thead.outerHTML : '';
        const theadHeight = thead ? thead.getBoundingClientRect().height : 0;
        
        let tableHtml = `<table>${theadHtml}<tbody>`;
        let tableHeight = theadHeight;
        let availableHeight = EFFECTIVE_HEIGHT - currentHeight;
        let rowsInCurrentSlide = 0;
        
        // Si el slide actual tiene un título, asegurar al menos 2 filas con él
        const currentSlideHasHeading = /<h[1-4][^>]*>/.test(currentSlideHtml);
        const minRowsWithHeading = currentSlideHasHeading ? 2 : 0;
        
        for (let j = 0; j < rows.length; j++) {
          const rowElement = rows[j] as HTMLElement;
          const rowHeight = rowElement.getBoundingClientRect().height;
          
          // If this row won't fit in available space
          if (tableHeight + rowHeight > availableHeight) {
            // Si tenemos título y pocas filas, verificar si podemos forzar SIN exceder límite absoluto
            if (currentSlideHasHeading && rowsInCurrentSlide < minRowsWithHeading) {
              const totalHeightWithRow = currentHeight + tableHeight + rowHeight;
              // Solo forzar si el TOTAL no excede EFFECTIVE_HEIGHT
              if (totalHeightWithRow <= EFFECTIVE_HEIGHT) {
                tableHtml += rowElement.outerHTML;
                tableHeight += rowHeight;
                rowsInCurrentSlide++;
                continue;
              }
              // Si excede, NO forzar - continuar con división normal
            }
            
            // Si hay filas acumuladas, cerrar tabla y guardar slide
            if (tableHtml !== `<table>${theadHtml}<tbody>`) {
              currentSlideHtml += tableHtml + '</tbody></table>';
              saveCurrentSlide();
              tableHtml = `<table>${theadHtml}<tbody>`;
              tableHeight = theadHeight;
              rowsInCurrentSlide = 0;
              availableHeight = EFFECTIVE_HEIGHT;
            } else if (currentSlideHtml !== '') {
              saveCurrentSlide();
              availableHeight = EFFECTIVE_HEIGHT;
            }
          }
          
          tableHtml += rowElement.outerHTML;
          tableHeight += rowHeight;
          rowsInCurrentSlide++;
        }
        
        // Add remaining table rows to current slide
        if (tableHtml !== `<table>${theadHtml}<tbody>`) {
          currentSlideHtml += tableHtml + '</tbody></table>';
          currentHeight += tableHeight;
        }
        continue;
      }
      
      // CASE 4: Headings (h1-h4) - implement "Keep With Next" logic
      if (isHeading(tagName)) {
        const nextElement = children[i + 1] as HTMLElement | undefined;
        
        if (nextElement) {
          const nextTagName = nextElement.tagName.toLowerCase();
          const nextHeight = nextElement.getBoundingClientRect().height;
          
          // Calcular el contenido mínimo que debe acompañar al título
          let minNextContentHeight = MIN_CONTENT_WITH_TITLE;
          
          // Si el siguiente es una lista/tabla, calcular altura de primeros items
          if (nextTagName === 'ul' || nextTagName === 'ol') {
            const firstItems = Array.from(nextElement.querySelectorAll(':scope > li')).slice(0, 2);
            minNextContentHeight = firstItems.reduce((sum, li) => 
              sum + (li as HTMLElement).getBoundingClientRect().height, 0);
          } else if (nextTagName === 'table') {
            const thead = nextElement.querySelector('thead');
            const firstRows = Array.from(nextElement.querySelectorAll('tbody tr, :scope > tr')).slice(0, 2);
            const theadHeight = thead ? thead.getBoundingClientRect().height : 0;
            minNextContentHeight = theadHeight + firstRows.reduce((sum, row) => 
              sum + (row as HTMLElement).getBoundingClientRect().height, 0);
          } else {
            minNextContentHeight = Math.min(nextHeight, MIN_CONTENT_WITH_TITLE);
          }
          
          // Si el título + contenido mínimo caben en un nuevo slide
          if (elementHeight + minNextContentHeight <= EFFECTIVE_HEIGHT) {
            // Guardar slide actual y poner título en nuevo slide
            saveCurrentSlide();
            currentSlideHtml = element.outerHTML;
            currentHeight = elementHeight;
            continue;
          }
        }
        
        // Si no hay siguiente elemento o no aplica, comportamiento normal
        saveCurrentSlide();
        currentSlideHtml = element.outerHTML;
        currentHeight = elementHeight;
        continue;
      }
      
      // CASE 5: Simple element (p, div, etc.) that doesn't fit
      saveCurrentSlide();
      currentSlideHtml = element.outerHTML;
      currentHeight = elementHeight;
    }
    
    // Save last slide if has content
    saveCurrentSlide();

    // Clean up
    document.body.removeChild(tempContainer);
    
    // Ensure at least one slide
    if (slides.length === 0 && html.trim()) {
      slides.push(html);
    }
    
    return slides;
  }, []);

  // Handle blur - redistribute content and remove empty slides
  const handleSlideBlur = useCallback(() => {
    // Collect HTML from all slide refs
    const combinedHtml = slideRefs.current
      .filter(ref => ref !== null)
      .map(ref => ref!.innerHTML)
      .join('');
    
    if (!combinedHtml.trim()) return;
    
    // Re-divide content
    const newSlides = divideContentIntoSlides(combinedHtml);
    
    // Filter out empty slides
    const filteredSlides = newSlides.filter(slideHtml => !isSlideEmpty(slideHtml));
    
    // Only update if there are actual changes to avoid infinite loops
    if (filteredSlides.length !== slidesContent.length || 
        filteredSlides.some((slide, i) => slide !== slidesContent[i])) {
      setSlidesContent(filteredSlides.length > 0 ? filteredSlides : ['<p></p>']);
    }
  }, [divideContentIntoSlides, slidesContent]);

  // Delete a specific slide
  const handleDeleteSlide = useCallback((indexToDelete: number) => {
    if (slidesContent.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "Debe haber al menos una slide de contenido",
        variant: "destructive",
      });
      return;
    }
    
    setSlidesContent(prev => prev.filter((_, index) => index !== indexToDelete));
    
    toast({
      title: "Slide eliminada",
      description: `Se eliminó la slide ${indexToDelete + 2}`,
    });
  }, [slidesContent.length, toast]);

  // Save content to Supabase
  const handleSave = async () => {
    if (!jobId) return;
    
    setIsSaving(true);
    try {
      // Collect HTML from all slide refs
      const combinedHtml = slideRefs.current
        .filter(ref => ref !== null)
        .map(ref => ref!.innerHTML)
        .join('');
      
      const { error } = await supabase
        .from('processing_jobs')
        .update({ 
          result_html: combinedHtml,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "¡Guardado!",
        description: "Los cambios se guardaron correctamente",
      });
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Load content from Supabase
  useEffect(() => {
    const loadContent = async () => {
      if (!jobId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('processing_jobs')
          .select('result_html, project_title')
          .eq('id', jobId)
          .eq('status', 'completed')
          .single();

        if (error) throw error;
        
        if (data?.result_html) {
          const cleanedHtml = cleanHtml(data.result_html);
          setProjectTitle(data.project_title || 'Presentación');
          
          // Wait for DOM to be ready, then divide content
          setTimeout(() => {
            const slides = divideContentIntoSlides(cleanedHtml);
            setSlidesContent(slides);
            setLoading(false);
          }, 100);
        } else {
          toast({
            title: "Sin contenido",
            description: "No se encontró contenido para mostrar",
            variant: "destructive",
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading content:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el contenido",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    loadContent();
  }, [jobId, toast, divideContentIntoSlides]);

  // Copy all content with formatting
  const handleCopyAll = async () => {
    try {
      const container = slidesContainerRef.current;
      if (!container) return;

      const styledContent = applyInlineStylesForCopy(container);
      const htmlContent = styledContent.innerHTML;
      const plainText = container.innerText || container.textContent || '';
      
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
      
      toast({
        title: "¡Copiado con formato!",
        description: "Pega en PowerPoint o Google Slides para mantener el formato",
      });
    } catch (error) {
      console.error('Error copying:', error);
      try {
        const container = slidesContainerRef.current;
        if (container) {
          await navigator.clipboard.writeText(container.innerText || '');
          toast({
            title: "Copiado como texto",
            description: "El contenido se copió sin formato",
          });
        }
      } catch (fallbackError) {
        toast({
          title: "Error",
          description: "No se pudo copiar el contenido",
          variant: "destructive",
        });
      }
    }
  };

  // Download as PDF (16:9 format to match slides exactly)
  const handleDownloadPdf = async () => {
    try {
      toast({
        title: "Generando PDF...",
        description: "Por favor espera mientras se genera el archivo",
      });

      const slides = document.querySelectorAll('.ppt-slide');
      if (slides.length === 0) {
        throw new Error('No hay slides para exportar');
      }

      // Use custom 16:9 format (same ratio as 1920x1080 / 1280x720)
      // 13.33" x 7.5" converted to mm = 338.67mm x 190.5mm
      const pdfWidth = 338.67;  // 16:9 width in mm
      const pdfHeight = 190.5;  // 16:9 height in mm

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight] // Custom 16:9 format
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        
        // Improved html2canvas options for better image capture
        const canvas = await html2canvas(slide, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 15000,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage([pdfWidth, pdfHeight], 'landscape');
        }
        
        // Image fills exactly the PDF page (same aspect ratio)
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`${projectTitle || 'presentacion'}.pdf`);
      
      toast({
        title: "¡PDF generado!",
        description: `Se descargó ${slides.length} slide${slides.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
  };

  // Download as PowerPoint (.pptx) - IMPROVED with conservative margins
  const handleDownloadPptx = async () => {
    try {
      toast({
        title: "Generando PowerPoint...",
        description: "Convirtiendo imágenes...",
      });

      // Convert images to base64 for proper embedding in PPTX
      const portadaBase64 = await imageToBase64(portadaImage);
      const graciasBase64 = await imageToBase64(graciasImage);

      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      pptx.author = 'Logistic Law';
      pptx.title = projectTitle;

      // CONSERVATIVE constants for content positioning
      const PPTX_CONTENT_WIDTH = 11.5; // inches (reduced from 12.3 for more right margin)
      const PPTX_MAX_Y = 6.5;          // Maximum Y (reduced from 6.8 for more bottom margin)
      const PPTX_LEFT_MARGIN = 0.6;    // Left margin (increased from 0.5)
      const PPTX_TOP_START = 0.5;      // Starting Y position

      // SLIDE 1: Portada (imagen completa con base64)
      const slidePortada = pptx.addSlide();
      slidePortada.addImage({
        data: portadaBase64,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
      });

      // SLIDES DE CONTENIDO
      for (let i = 0; i < slidesContent.length; i++) {
        const slide = pptx.addSlide();
        slide.background = { color: 'FFFFFF' };
        
        // Extraer texto del HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = slidesContent[i];
        
        // Procesar elementos y convertirlos a objetos PptxGenJS
        let yPos = PPTX_TOP_START;
        const children = Array.from(tempDiv.children);
        
        for (const element of children) {
          const tagName = element.tagName.toLowerCase();
          const text = element.textContent || '';
          
          if (!text.trim()) continue;
          
          if (isHeading(tagName)) {
            const fontSize = tagName === 'h1' ? 26 : tagName === 'h2' ? 20 : tagName === 'h3' ? 16 : 14;
            const height = calculateTextHeight(text, fontSize, PPTX_CONTENT_WIDTH);
            
            // Check if fits before adding
            if (yPos + height > PPTX_MAX_Y) break;
            
            slide.addText(text, {
              x: PPTX_LEFT_MARGIN,
              y: yPos,
              w: PPTX_CONTENT_WIDTH,
              h: height,
              fontSize,
              bold: true,
              color: '1a1a1a',
              valign: 'top',
              wrap: true,
            });
            yPos += height + 0.2;
            
          } else if (tagName === 'p') {
            const height = calculateTextHeight(text, 12, PPTX_CONTENT_WIDTH);
            
            if (yPos + height > PPTX_MAX_Y) break;
            
            slide.addText(text, {
              x: PPTX_LEFT_MARGIN,
              y: yPos,
              w: PPTX_CONTENT_WIDTH,
              h: height,
              fontSize: 12,
              color: '333333',
              valign: 'top',
              wrap: true,
            });
            yPos += height + 0.15;
            
          } else if (tagName === 'ul' || tagName === 'ol') {
            const items = Array.from(element.querySelectorAll('li'));
            const bulletItems = items.map(li => ({
              text: li.textContent || '',
              options: { bullet: tagName === 'ul' ? { type: 'bullet' as const } : { type: 'number' as const } }
            }));
            
            if (bulletItems.length > 0) {
              // More conservative height calculation for lists
              const totalChars = items.reduce((acc, li) => acc + (li.textContent || '').length, 0);
              const avgCharsPerItem = totalChars / items.length;
              const linesPerItem = Math.ceil(avgCharsPerItem / 80);
              const height = Math.max(items.length * linesPerItem * 0.25 + 0.2, 0.5);
              
              if (yPos + height > PPTX_MAX_Y) break;
              
              slide.addText(bulletItems, {
                x: PPTX_LEFT_MARGIN + 0.2,
                y: yPos,
                w: PPTX_CONTENT_WIDTH - 0.2,
                h: Math.min(height, PPTX_MAX_Y - yPos),
                fontSize: 11,
                color: '333333',
                valign: 'top',
              });
              yPos += height + 0.2;
            }
            
          } else if (tagName === 'table') {
            const rows: PptxGenJS.TableRow[] = [];
            const tableRows = element.querySelectorAll('tr');
            tableRows.forEach(tr => {
              const cells: PptxGenJS.TableCell[] = [];
              tr.querySelectorAll('th, td').forEach(cell => {
                cells.push({ text: cell.textContent || '' });
              });
              if (cells.length > 0) rows.push(cells);
            });
            
            if (rows.length > 0) {
              const tableHeight = Math.min(rows.length * 0.4 + 0.3, PPTX_MAX_Y - yPos);
              
              if (yPos + tableHeight > PPTX_MAX_Y) break;
              
              slide.addTable(rows, {
                x: PPTX_LEFT_MARGIN,
                y: yPos,
                w: PPTX_CONTENT_WIDTH,
                h: tableHeight,
                fontSize: 9,
                border: { pt: 0.5, color: '666666' },
                fill: { color: 'F5F5F5' },
              });
              yPos += tableHeight + 0.25;
            }
          }
        }
        
        // Número de slide (positioned for 16:9 with margins)
        slide.addText(`${i + 2} / ${slidesContent.length + 2}`, {
          x: 11.5,
          y: 6.9,
          w: 1.2,
          h: 0.3,
          fontSize: 9,
          color: '999999',
          align: 'right',
        });
      }

      // SLIDE FINAL: Gracias (imagen completa con base64)
      const slideGracias = pptx.addSlide();
      slideGracias.addImage({
        data: graciasBase64,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
      });

      // Descargar archivo
      await pptx.writeFile({ fileName: `${projectTitle || 'presentacion'}.pptx` });
      
      toast({
        title: "¡PowerPoint generado!",
        description: `Se descargó con ${slidesContent.length + 2} slides`,
      });
    } catch (error) {
      console.error('Error generating PPTX:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PowerPoint",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2d2d2d] flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 text-[hsl(var(--sierra-teal))] animate-spin mx-auto" />
          <p className="text-white text-lg">Cargando presentación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2d2d2d]">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-[#1a1a1a] border-b border-[#404040] shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back button and title */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/saved-files')}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-[#404040]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-2">
              <Presentation className="h-5 w-5 text-[hsl(var(--sierra-teal))]" />
              <span className="text-white font-medium truncate max-w-[300px]">
                {projectTitle}
              </span>
              <span className="text-gray-400 text-sm">
                ({slidesContent.length + 2} slide{slidesContent.length + 2 !== 1 ? 's' : ''})
              </span>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="border-[#404040] text-gray-300 hover:text-white hover:bg-[#404040]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button
              onClick={handleCopyAll}
              variant="outline"
              size="sm"
              className="border-[#404040] text-gray-300 hover:text-white hover:bg-[#404040]"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Todo
            </Button>
            <Button
              onClick={handleDownloadPptx}
              size="sm"
              className="sierra-teal-gradient text-white border-0"
            >
              <FileText className="h-4 w-4 mr-2" />
              Descargar PPTX
            </Button>
            <Button
              onClick={handleDownloadPdf}
              variant="outline"
              size="sm"
              className="border-[#404040] text-gray-300 hover:text-white hover:bg-[#404040]"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Slides Container */}
      <div 
        ref={slidesContainerRef}
        className="py-8 px-4 flex flex-col items-center gap-6"
      >
        {/* SLIDE PORTADA (no editable) */}
        <div
          className="ppt-slide shadow-2xl overflow-hidden"
          style={{
            width: `${SLIDE_WIDTH}px`,
            height: `${SLIDE_HEIGHT}px`,
            backgroundImage: `url(${portadaImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          <div className="absolute bottom-3 right-4 text-xs text-white/70 font-medium pointer-events-none">
            1 / {slidesContent.length + 2}
          </div>
        </div>

        {/* SLIDES DE CONTENIDO (editables, eliminables) */}
        {slidesContent.map((slideHtml, index) => (
          <div
            key={index}
            className="ppt-slide bg-white shadow-2xl overflow-hidden group"
            style={{
              width: `${SLIDE_WIDTH}px`,
              height: `${SLIDE_HEIGHT}px`,
              padding: `${PADDING}px`,
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* Botón eliminar (visible al hover) */}
            <Button
              onClick={() => handleDeleteSlide(index)}
              variant="destructive"
              size="icon"
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-8 w-8"
              title="Eliminar slide"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            {/* Slide number badge */}
            <div className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium pointer-events-none">
              {index + 2} / {slidesContent.length + 2}
            </div>
            
            {/* Slide content - editable */}
            <div 
              ref={el => slideRefs.current[index] = el}
              className="slide-content"
              contentEditable
              suppressContentEditableWarning
              onBlur={handleSlideBlur}
              dangerouslySetInnerHTML={{ __html: slideHtml }}
            />
          </div>
        ))}

        {/* SLIDE GRACIAS (no editable) */}
        <div
          className="ppt-slide shadow-2xl overflow-hidden"
          style={{
            width: `${SLIDE_WIDTH}px`,
            height: `${SLIDE_HEIGHT}px`,
            backgroundImage: `url(${graciasImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          <div className="absolute bottom-3 right-4 text-xs text-white/70 font-medium pointer-events-none">
            {slidesContent.length + 2} / {slidesContent.length + 2}
          </div>
        </div>
      </div>
    </div>
  );
}
