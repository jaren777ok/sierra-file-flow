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
import slideBackgroundImage from '@/assets/hojas_de_en_medio.png';

// 16:9 HD dimensions (standard presentation format)
const SLIDE_WIDTH = 1280;  // 16:9 HD width
const SLIDE_HEIGHT = 720;  // 16:9 HD height

// Content area margins (respecting logo and bottom strips)
const CONTENT_TOP = 30;
const CONTENT_BOTTOM = 60;   // Reduced to extend text area closer to bottom strips
const CONTENT_LEFT = 60;
const CONTENT_RIGHT = 180;
const CONTENT_PADDING = 14;  // Slightly reduced padding

// Calculated text area dimensions - MAXIMIZED for visible content
const TEXT_AREA_HEIGHT = 600;  // 720 - 30 - 60 - 30 = 600px visible (24 lines × 25px)
const TEXT_AREA_WIDTH = 1024;

// Font and line constants - SYNCHRONIZED WITH CSS .ppt-content-area
const LINE_HEIGHT_PX = 25;    // Matches CSS: lines every 25px (line 556 in index.css)
const FONT_SIZE_PX = 14.67;   // Matches CSS: font-size: 14.67px (line 454 in index.css)

// SAFE LIMITS with buffer for margins (h1, h2, li have extra margins)
const MAX_LINES_PER_SLIDE = 22;  // 24 - 2 buffer for element margins

// Helper para verificar si un elemento es un título
const isHeading = (tagName: string): boolean => {
  return ['h1', 'h2', 'h3', 'h4'].includes(tagName);
};

// MEDIR ALTURA REAL de un elemento en el DOM - SINCRONIZADO CON CSS
const measureElementHeight = (element: HTMLElement): number => {
  // Crear contenedor temporal con los MISMOS estilos que .ppt-content-area en CSS
  const tempContainer = document.createElement('div');
  tempContainer.style.cssText = `
    position: absolute;
    visibility: hidden;
    left: -9999px;
    width: ${TEXT_AREA_WIDTH - CONTENT_PADDING * 2}px;
    font-family: Arial, sans-serif;
    font-size: ${FONT_SIZE_PX}px;
    line-height: 1.7;
    padding: 0;
    margin: 0;
  `;
  // Aplicar clase CSS real para heredar estilos exactos
  tempContainer.className = 'ppt-content-area';
  document.body.appendChild(tempContainer);
  
  const clone = element.cloneNode(true) as HTMLElement;
  tempContainer.appendChild(clone);
  
  // Medir altura TOTAL incluyendo márgenes del elemento
  const height = clone.offsetHeight;
  document.body.removeChild(tempContainer);
  
  // Convertir altura en píxeles a líneas usando LINE_HEIGHT_PX sincronizado
  return Math.ceil(height / LINE_HEIGHT_PX);
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

  // Count lines for an element using REAL DOM MEASUREMENT
  const countElementLines = (element: HTMLElement): number => {
    // MEDIR ALTURA REAL en el DOM - garantiza precisión
    return measureElementHeight(element);
  };

  // ALGORITMO PRINCIPAL: Divide contenido FILA POR FILA y ITEM POR ITEM
  const divideContentIntoSlides = useCallback((html: string): string[] => {
    const slides: string[] = [];
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;
    
    let currentSlideHtml = '';
    let currentLines = 0;
    
    // Guardar slide actual y resetear
    const saveSlide = () => {
      if (currentSlideHtml.trim()) {
        slides.push(currentSlideHtml);
      }
      currentSlideHtml = '';
      currentLines = 0;
    };
    
    // Procesar cada elemento hijo
    const children = Array.from(tempContainer.children);
    
    for (const child of children) {
      const element = child as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      
      // === TABLAS: Procesar FILA POR FILA ===
      if (tagName === 'table') {
        const thead = element.querySelector('thead');
        const theadHtml = thead?.outerHTML || '';
        // MEDIR altura real del header
        const headerLines = thead ? measureElementHeight(thead as HTMLElement) : 0;
        
        // Obtener todas las filas del tbody o directas
        const tbody = element.querySelector('tbody');
        const rows = Array.from(tbody ? tbody.querySelectorAll('tr') : element.querySelectorAll(':scope > tr:not(thead tr)'));
        
        let tableStarted = false;
        
        for (const row of rows) {
          const rowHtml = (row as HTMLElement).outerHTML;
          // MEDIR altura real de la fila (no asumir 1 línea)
          const rowLines = measureElementHeight(row as HTMLElement);
          
          // ¿Cabe esta fila en la slide actual?
          const linesNeeded = tableStarted ? rowLines : (headerLines + rowLines + 1);
          
          if (currentLines + linesNeeded > MAX_LINES_PER_SLIDE) {
            // Cerrar tabla si está abierta
            if (tableStarted) {
              currentSlideHtml += '</tbody></table>';
            }
            saveSlide();
            
            // Nueva slide con header de tabla + esta fila
            currentSlideHtml = `<table>${theadHtml}<tbody>${rowHtml}`;
            currentLines = headerLines + rowLines;
            tableStarted = true;
          } else {
            // Agregar fila a slide actual
            if (!tableStarted) {
              currentSlideHtml += `<table>${theadHtml}<tbody>`;
              currentLines += headerLines;
              tableStarted = true;
            }
            currentSlideHtml += rowHtml;
            currentLines += rowLines;
          }
        }
        
        // Cerrar tabla al terminar
        if (tableStarted) {
          currentSlideHtml += '</tbody></table>';
        }
        continue;
      }
      
      // === LISTAS: Procesar ITEM POR ITEM con MEDICIÓN REAL ===
      if (tagName === 'ul' || tagName === 'ol') {
        const items = Array.from(element.querySelectorAll(':scope > li'));
        let listStarted = false;
        
        for (const item of items) {
          const itemHtml = (item as HTMLElement).outerHTML;
          // MEDIR altura real del item en el DOM
          const itemLines = measureElementHeight(item as HTMLElement);
          
          // ¿Cabe este item en la slide actual?
          if (currentLines + itemLines > MAX_LINES_PER_SLIDE) {
            // Cerrar lista si está abierta
            if (listStarted) {
              currentSlideHtml += `</${tagName}>`;
            }
            saveSlide();
            
            // Nueva slide con nueva lista + este item
            currentSlideHtml = `<${tagName}>${itemHtml}`;
            currentLines = itemLines;
            listStarted = true;
          } else {
            // Agregar item a slide actual
            if (!listStarted) {
              currentSlideHtml += `<${tagName}>`;
              listStarted = true;
            }
            currentSlideHtml += itemHtml;
            currentLines += itemLines;
          }
        }
        
        // Cerrar lista al terminar
        if (listStarted) {
          currentSlideHtml += `</${tagName}>`;
        }
        continue;
      }
      
      // === TÍTULOS: Nunca dividir, mover completo si no cabe ===
      if (isHeading(tagName)) {
        const elementLines = countElementLines(element);
        
        if (currentLines + elementLines > MAX_LINES_PER_SLIDE) {
          saveSlide();
        }
        
        currentSlideHtml += element.outerHTML;
        currentLines += elementLines;
        continue;
      }
      
      // === PÁRRAFOS: Medir con DOM y dividir por oraciones si hay espacio ===
      if (tagName === 'p') {
        const totalLines = measureElementHeight(element);
        
        // Si cabe completo, agregar normalmente
        if (currentLines + totalLines <= MAX_LINES_PER_SLIDE) {
          currentSlideHtml += element.outerHTML;
          currentLines += totalLines;
          continue;
        }
        
        // Calcular líneas disponibles
        const linesAvailable = MAX_LINES_PER_SLIDE - currentLines;
        
        // Si hay espacio suficiente (>= 3 líneas), dividir por oraciones
        if (linesAvailable >= 3) {
          const text = element.textContent || '';
          const sentences = text.split(/(?<=[.!?])\s+/);
          
          if (sentences.length > 1) {
            let firstPart = '';
            let remainingPart = '';
            let firstPartLines = 0;
            
            // Agregar oraciones hasta llenar el espacio disponible
            for (let i = 0; i < sentences.length; i++) {
              const testPart = firstPart + (firstPart ? ' ' : '') + sentences[i];
              
              // Crear elemento temporal para medir
              const testElement = document.createElement('p');
              testElement.textContent = testPart;
              const testLines = measureElementHeight(testElement);
              
              if (testLines <= linesAvailable) {
                firstPart = testPart;
                firstPartLines = testLines;
              } else {
                // El resto va a la siguiente slide
                remainingPart = sentences.slice(i).join(' ');
                break;
              }
            }
            
            // Agregar primera parte a slide actual
            if (firstPart) {
              currentSlideHtml += `<p>${firstPart}</p>`;
              currentLines += firstPartLines;
            }
            
            // Guardar slide y agregar resto a nueva slide
            if (remainingPart) {
              saveSlide();
              const remainingElement = document.createElement('p');
              remainingElement.textContent = remainingPart;
              currentSlideHtml = `<p>${remainingPart}</p>`;
              currentLines = measureElementHeight(remainingElement);
            }
            continue;
          }
        }
        
        // Si muy poco espacio o no se puede dividir, mover completo
        saveSlide();
        currentSlideHtml = element.outerHTML;
        currentLines = totalLines;
        continue;
      }
      
      // === OTROS ELEMENTOS: Agregar o mover completo ===
      const elementLines = countElementLines(element);
      
      if (currentLines + elementLines > MAX_LINES_PER_SLIDE) {
        saveSlide();
      }
      
      currentSlideHtml += element.outerHTML;
      currentLines += elementLines;
    }
    
    // Guardar última slide
    saveSlide();
    
    // Asegurar al menos una slide
    return slides.length > 0 ? slides : ['<p></p>'];
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

  // Save content to Supabase (save to result_html_ppt for PPT editor)
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
          result_html_ppt: combinedHtml,
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
          .select('result_html_ppt, result_html, project_title')
          .eq('id', jobId)
          .eq('status', 'completed')
          .single();

        if (error) throw error;
        
        // Use result_html_ppt with fallback to result_html for backwards compatibility
        const htmlContent = (data as any)?.result_html_ppt || data?.result_html;
        
        if (htmlContent) {
          const cleanedHtml = cleanHtml(htmlContent);
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

  // PDF generation progress state
  const [pdfProgress, setPdfProgress] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Download as PDF (16:9 format to match slides exactly)
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setPdfProgress(0);

      const slides = document.querySelectorAll('.ppt-slide');
      if (slides.length === 0) {
        throw new Error('No hay slides para exportar');
      }

      const pdfWidth = 338.67;
      const pdfHeight = 190.5;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        
        // Update progress
        setPdfProgress(Math.round(((i + 0.5) / slides.length) * 100));
        
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
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        // Update progress after slide complete
        setPdfProgress(Math.round(((i + 1) / slides.length) * 100));
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
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(0);
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
      {/* PDF Generation Progress Modal */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <div className="bg-[#1a1a1a] border border-[#404040] rounded-lg p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--sierra-teal))] mx-auto"></div>
              <h3 className="text-lg font-semibold text-white">Generando PDF...</h3>
              <p className="text-sm text-gray-400">
                Procesando slide {Math.ceil((pdfProgress / 100) * (slidesContent.length + 2))} de {slidesContent.length + 2}
              </p>
              <div className="w-full bg-[#404040] rounded-full h-3">
                <div 
                  className="bg-[hsl(var(--sierra-teal))] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${pdfProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{pdfProgress}% completado</p>
            </div>
          </div>
        </div>
      )}
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
          <div className="flex items-center gap-3">
            {/* Guardar - HIDDEN but functionality preserved */}
            {false && (
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
            )}
            <Button
              onClick={handleCopyAll}
              size="sm"
              className="bg-white/90 text-gray-800 hover:bg-white border border-gray-300 shadow-sm font-medium"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Todo
            </Button>
            {/* Descargar PPTX - HIDDEN but functionality preserved */}
            {false && (
              <Button
                onClick={handleDownloadPptx}
                size="sm"
                className="sierra-teal-gradient text-white border-0"
              >
                <FileText className="h-4 w-4 mr-2" />
                Descargar PPTX
              </Button>
            )}
            <Button
              onClick={handleDownloadPdf}
              size="sm"
              className="bg-[hsl(var(--sierra-teal))] hover:bg-[hsl(var(--sierra-teal-light))] text-white shadow-sm font-medium border-0"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
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

        {/* SLIDES DE CONTENIDO (editables, eliminables) con fondo corporativo */}
        {slidesContent.map((slideHtml, index) => (
          <div
            key={index}
            className="ppt-slide shadow-2xl overflow-hidden group"
            style={{
              width: `${SLIDE_WIDTH}px`,
              height: `${SLIDE_HEIGHT}px`,
              boxSizing: 'border-box',
              position: 'relative',
              backgroundImage: `url(${slideBackgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
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
            <div className="absolute bottom-3 right-4 text-xs text-gray-600 font-medium pointer-events-none">
              {index + 2} / {slidesContent.length + 2}
            </div>
            
            {/* Slide content - fixed text area with line-based limits */}
            <div 
              ref={el => slideRefs.current[index] = el}
              className="slide-content ppt-content-area"
              contentEditable
              suppressContentEditableWarning
              onBlur={handleSlideBlur}
              style={{
                position: 'absolute',
                top: `${CONTENT_TOP}px`,
                left: `${CONTENT_LEFT}px`,
                right: `${CONTENT_RIGHT}px`,
                bottom: `${CONTENT_BOTTOM}px`,
                padding: `${CONTENT_PADDING}px`,
                height: `${TEXT_AREA_HEIGHT}px`,  // Fixed height - strict limit
                overflow: 'hidden',  // NO scroll - content must fit within lines
                color: '#1a1a1a',
                backgroundColor: 'transparent',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11pt',
                lineHeight: 1.5,
              }}
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
