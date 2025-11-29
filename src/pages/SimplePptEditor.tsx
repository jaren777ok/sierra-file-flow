import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Download, RefreshCw, Presentation, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// A4 Landscape dimensions in pixels (96 DPI)
const SLIDE_WIDTH = 1123; // 297mm
const SLIDE_HEIGHT = 794; // 210mm
const PADDING = 40;
const SAFETY_MARGIN = 100; // Reducido de 150 a 100 para mejor aprovechamiento
const CONTENT_HEIGHT = SLIDE_HEIGHT - (PADDING * 2); // 714px
const EFFECTIVE_HEIGHT = CONTENT_HEIGHT - SAFETY_MARGIN; // 614px
const MIN_CONTENT_WITH_TITLE = 80; // Mínimo contenido que debe acompañar a un título

// Helper para verificar si un elemento es un título
const isHeading = (tagName: string): boolean => {
  return ['h1', 'h2', 'h3', 'h4'].includes(tagName);
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

  // Download as PDF (landscape)
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

      // Create PDF in landscape A4
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 297; // A4 landscape width in mm
      const pdfHeight = 210; // A4 landscape height in mm

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        
        const canvas = await html2canvas(slide, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
        });

        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
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
                ({slidesContent.length} slide{slidesContent.length !== 1 ? 's' : ''})
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
              onClick={handleDownloadPdf}
              size="sm"
              className="sierra-teal-gradient text-white border-0"
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
        {slidesContent.map((slideHtml, index) => (
          <div
            key={index}
            className="ppt-slide bg-white shadow-2xl overflow-hidden"
            style={{
              width: `${SLIDE_WIDTH}px`,
              height: `${SLIDE_HEIGHT}px`,
              padding: `${PADDING}px`,
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* Slide number badge */}
            <div className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium pointer-events-none">
              {index + 1} / {slidesContent.length}
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
      </div>
    </div>
  );
}
