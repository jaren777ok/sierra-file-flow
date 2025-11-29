import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Download, RefreshCw, Presentation } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// A4 Landscape dimensions in pixels (96 DPI)
const SLIDE_WIDTH = 1123; // 297mm
const SLIDE_HEIGHT = 794; // 210mm
const PADDING = 40;
const SAFETY_MARGIN = 150; // Buffer de seguridad aumentado para evitar texto oculto
const CONTENT_HEIGHT = SLIDE_HEIGHT - (PADDING * 2); // 714px
const EFFECTIVE_HEIGHT = CONTENT_HEIGHT - SAFETY_MARGIN; // 564px - más conservador

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

export default function SimplePptEditor() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [slidesContent, setSlidesContent] = useState<string[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const slidesContainerRef = useRef<HTMLDivElement>(null);

  // Divide content into slides based on element heights - with intelligent list/table splitting
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
    
    // Get all block-level children
    const children = Array.from(tempContainer.children);
    
    for (let i = 0; i < children.length; i++) {
      const element = children[i] as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      const elementHeight = element.getBoundingClientRect().height;
      
      // CASE 1: Element fits in current slide
      if (currentHeight + elementHeight <= EFFECTIVE_HEIGHT) {
        currentSlideHtml += element.outerHTML;
        currentHeight += elementHeight;
        continue;
      }
      
      // CASE 2: Current slide has content, save it and start new
      if (currentSlideHtml !== '') {
        slides.push(currentSlideHtml);
        currentSlideHtml = '';
        currentHeight = 0;
      }
      
      // CASE 3: Element is a list (ul/ol) - divide by items
      if (tagName === 'ul' || tagName === 'ol') {
        const listItems = Array.from(element.querySelectorAll(':scope > li'));
        let listHtml = `<${tagName}>`;
        let listHeight = 0;
        
        for (const li of listItems) {
          const liElement = li as HTMLElement;
          const liHeight = liElement.getBoundingClientRect().height;
          
          // If adding this item would exceed and we have items, save slide
          if (listHeight + liHeight > EFFECTIVE_HEIGHT - currentHeight && listHtml !== `<${tagName}>`) {
            slides.push(currentSlideHtml + listHtml + `</${tagName}>`);
            currentSlideHtml = '';
            currentHeight = 0;
            listHtml = `<${tagName}>`;
            listHeight = 0;
          }
          
          listHtml += liElement.outerHTML;
          listHeight += liHeight;
        }
        
        // Add remaining list items to current slide
        if (listHtml !== `<${tagName}>`) {
          currentSlideHtml += listHtml + `</${tagName}>`;
          currentHeight += listHeight;
        }
        continue;
      }
      
      // CASE 4: Element is a table - divide by rows
      if (tagName === 'table') {
        const thead = element.querySelector('thead');
        const tbody = element.querySelector('tbody');
        const rows = Array.from(tbody ? tbody.querySelectorAll('tr') : element.querySelectorAll(':scope > tr'));
        const theadHtml = thead ? thead.outerHTML : '';
        const theadHeight = thead ? thead.getBoundingClientRect().height : 0;
        
        let tableHtml = `<table>${theadHtml}<tbody>`;
        let tableHeight = theadHeight;
        
        for (const row of rows) {
          const rowElement = row as HTMLElement;
          const rowHeight = rowElement.getBoundingClientRect().height;
          
          // If adding this row would exceed and we have rows, save slide
          if (tableHeight + rowHeight > EFFECTIVE_HEIGHT - currentHeight && tableHtml !== `<table>${theadHtml}<tbody>`) {
            slides.push(currentSlideHtml + tableHtml + '</tbody></table>');
            currentSlideHtml = '';
            currentHeight = 0;
            tableHtml = `<table>${theadHtml}<tbody>`; // Repeat header in new table
            tableHeight = theadHeight;
          }
          
          tableHtml += rowElement.outerHTML;
          tableHeight += rowHeight;
        }
        
        // Add remaining table rows to current slide
        if (tableHtml !== `<table>${theadHtml}<tbody>`) {
          currentSlideHtml += tableHtml + '</tbody></table>';
          currentHeight += tableHeight;
        }
        continue;
      }
      
      // CASE 5: Simple element (h1-h4, p, etc.) - add whole to new slide
      currentSlideHtml += element.outerHTML;
      currentHeight += elementHeight;
    }
    
    // Save last slide if has content
    if (currentSlideHtml !== '') {
      slides.push(currentSlideHtml);
    }

    // Clean up
    document.body.removeChild(tempContainer);
    
    // Ensure at least one slide
    if (slides.length === 0 && html.trim()) {
      slides.push(html);
    }
    
    return slides;
  }, []);

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
            <div className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
              {index + 1} / {slidesContent.length}
            </div>
            
            {/* Slide content - sin maxHeight, el padre tiene overflow:hidden */}
            <div 
              className="slide-content"
              dangerouslySetInnerHTML={{ __html: slideHtml }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
