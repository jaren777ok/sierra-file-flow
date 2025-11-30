import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SimpleToolbar } from '@/components/editors/SimpleToolbar';
import { SimpleRuler } from '@/components/editors/SimpleRuler';
import { Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import fondoA4Image from '@/assets/FONDO_A4.png';

// A4 Portrait dimensions (standard document format)
const PAGE_WIDTH = 793;   // 21cm at 96 DPI
const PAGE_HEIGHT = 1122; // 29.7cm at 96 DPI
const PADDING_VERTICAL = 80;   // Top/bottom margins (increased for logo space)
const DEFAULT_PADDING_HORIZONTAL = 80; // Default left/right (adjustable via ruler)
const CONTENT_HEIGHT = PAGE_HEIGHT - (PADDING_VERTICAL * 2); // 962px
const SAFETY_MARGIN = 50; // Reduced buffer for better space usage
const EFFECTIVE_HEIGHT = CONTENT_HEIGHT - SAFETY_MARGIN; // 912px

// Function to clean HTML - extract only body content and remove \n literals
const cleanHtml = (rawHtml: string): string => {
  let cleaned = rawHtml.replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/\\"/g, '"');
  
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1].trim();
  } else {
    cleaned = cleaned
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>|<\/html>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>|<\/body>/gi, '')
      .trim();
  }
  
  cleaned = cleaned.replace(/>\s*\n\s*</g, '><');
  return cleaned;
};

// Function to apply inline styles for copying to Word/Google Docs
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
    h1.setAttribute('style', 'font-size: 24pt; font-weight: 800; text-align: center; margin: 24pt 0 16pt 0; border-bottom: 2px solid #000;');
  });
  
  clone.querySelectorAll('h2').forEach(h2 => {
    h2.setAttribute('style', 'font-size: 16pt; font-weight: 700; margin: 20pt 0 10pt 0; text-transform: uppercase;');
  });
  
  clone.querySelectorAll('h3').forEach(h3 => {
    h3.setAttribute('style', 'font-size: 13pt; font-weight: 700; margin: 14pt 0 8pt 0; text-transform: uppercase;');
  });
  
  clone.querySelectorAll('p').forEach(p => {
    p.setAttribute('style', 'margin-bottom: 8pt; text-align: justify; line-height: 1.5;');
  });
  
  clone.querySelectorAll('ul').forEach(ul => {
    ul.setAttribute('style', 'margin: 8pt 0; padding-left: 24pt; list-style-type: disc;');
  });
  
  clone.querySelectorAll('ol').forEach(ol => {
    ol.setAttribute('style', 'margin: 8pt 0; padding-left: 24pt; list-style-type: decimal;');
  });
  
  clone.querySelectorAll('li').forEach(li => {
    li.setAttribute('style', 'margin-bottom: 4pt; line-height: 1.5;');
  });
  
  clone.querySelectorAll('strong, b').forEach(el => {
    el.setAttribute('style', 'font-weight: 700;');
  });
  
  return clone;
};

// Check if element is a heading
const isHeading = (tagName: string): boolean => {
  return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName.toLowerCase());
};

// Check if page content is empty
const isPageEmpty = (html: string): boolean => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  return textContent.trim().length === 0;
};

// Measure element height accurately with all styles applied
const measureElementHeight = (element: HTMLElement, containerWidth: number): number => {
  const measureDiv = document.createElement('div');
  measureDiv.className = 'page-content-area';
  measureDiv.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: ${containerWidth}px;
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  `;
  
  const clone = element.cloneNode(true) as HTMLElement;
  measureDiv.appendChild(clone);
  document.body.appendChild(measureDiv);
  
  const height = measureDiv.offsetHeight;
  document.body.removeChild(measureDiv);
  
  return height;
};

// Split long paragraphs into multiple parts that fit in a page
const splitLongParagraph = (
  text: string, 
  containerWidth: number,
  maxHeight: number
): string[] => {
  // Estimate characters per line based on width (~7px per character at 11pt)
  const charsPerLine = Math.floor(containerWidth / 7);
  // Estimate lines per page based on height (~24px per line with line-height 1.6)
  const linesPerPage = Math.floor(maxHeight / 24);
  const charsPerPage = charsPerLine * linesPerPage;
  
  const parts: string[] = [];
  let remaining = text;
  
  while (remaining.length > charsPerPage) {
    let cutPoint = charsPerPage;
    // Find a good break point (space, period, comma)
    while (cutPoint > charsPerPage * 0.7 && !/[\s.,;:!?]/.test(remaining[cutPoint])) {
      cutPoint--;
    }
    if (cutPoint <= charsPerPage * 0.7) cutPoint = charsPerPage;
    
    parts.push(remaining.substring(0, cutPoint).trim());
    remaining = remaining.substring(cutPoint).trim();
  }
  
  if (remaining) parts.push(remaining);
  return parts;
};

// Divide content into A4 pages based on height - IMPROVED VERSION
const divideContentIntoPages = (
  htmlContent: string, 
  leftMargin: number, 
  rightMargin: number
): string[] => {
  if (!htmlContent || htmlContent.trim() === '') {
    return [''];
  }

  const CONTENT_WIDTH = PAGE_WIDTH - leftMargin - rightMargin;

  // Create temporary container with ALL styles applied
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = htmlContent;
  tempContainer.className = 'page-content-area';
  tempContainer.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: ${CONTENT_WIDTH}px;
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  `;
  document.body.appendChild(tempContainer);

  const pages: string[] = [];
  let currentPageHtml = '';
  let currentHeight = 0;

  const children = Array.from(tempContainer.children);

  for (let i = 0; i < children.length; i++) {
    const element = children[i] as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    
    // Measure element height accurately
    const elementHeight = measureElementHeight(element, CONTENT_WIDTH);

    // CASE 1: Element fits in current page
    if (currentHeight + elementHeight <= EFFECTIVE_HEIGHT) {
      currentPageHtml += element.outerHTML;
      currentHeight += elementHeight;
      continue;
    }

    // CASE 2: Element doesn't fit - handle specially

    // 2A: Lists - split by items
    if (tagName === 'ul' || tagName === 'ol') {
      const items = Array.from(element.querySelectorAll(':scope > li'));
      let listHtml = `<${tagName}>`;
      let listHeight = 8; // Initial margin
      
      for (let j = 0; j < items.length; j++) {
        const item = items[j] as HTMLElement;
        const itemHeight = measureElementHeight(item, CONTENT_WIDTH - 24); // Account for list padding
        
        // If a single item is too large for an empty page, we must include it anyway
        if (currentHeight === 0 && listHeight === 8 && itemHeight > EFFECTIVE_HEIGHT) {
          listHtml += item.outerHTML;
          listHeight += itemHeight;
          continue;
        }
        
        if (currentHeight + listHeight + itemHeight <= EFFECTIVE_HEIGHT) {
          listHtml += item.outerHTML;
          listHeight += itemHeight;
        } else {
          // Close current list portion and add to page
          if (listHtml !== `<${tagName}>`) {
            listHtml += `</${tagName}>`;
            currentPageHtml += listHtml;
          }
          
          // Save current page
          if (currentPageHtml.trim()) {
            pages.push(currentPageHtml);
          }
          
          // Start new page
          currentPageHtml = '';
          currentHeight = 0;
          listHtml = `<${tagName}>` + item.outerHTML;
          listHeight = 8 + itemHeight;
        }
      }
      
      // Add remaining list items
      if (listHtml !== `<${tagName}>`) {
        listHtml += `</${tagName}>`;
        currentPageHtml += listHtml;
        currentHeight += listHeight;
      }
    }
    // 2B: Tables - split by rows
    else if (tagName === 'table') {
      const thead = element.querySelector('thead');
      const theadHtml = thead?.outerHTML || '';
      const theadHeight = thead ? measureElementHeight(thead, CONTENT_WIDTH) : 0;
      
      const rows = Array.from(element.querySelectorAll('tbody > tr, :scope > tr'));
      let tableHtml = `<table>${theadHtml}<tbody>`;
      let tableHeight = theadHeight + 12; // Include margins
      
      for (const row of rows) {
        if (row.closest('thead')) continue;
        
        const rowEl = row as HTMLElement;
        const rowHeight = measureElementHeight(rowEl, CONTENT_WIDTH);
        
        // If a single row is too large for an empty page
        if (currentHeight === 0 && tableHeight === theadHeight + 12 && rowHeight > EFFECTIVE_HEIGHT - theadHeight) {
          tableHtml += row.outerHTML;
          tableHeight += rowHeight;
          continue;
        }
        
        if (currentHeight + tableHeight + rowHeight <= EFFECTIVE_HEIGHT) {
          tableHtml += row.outerHTML;
          tableHeight += rowHeight;
        } else {
          // Save current table portion
          if (tableHtml !== `<table>${theadHtml}<tbody>`) {
            tableHtml += '</tbody></table>';
            currentPageHtml += tableHtml;
          }
          
          // Save current page
          if (currentPageHtml.trim()) {
            pages.push(currentPageHtml);
          }
          
          // Start new page with header repeated
          currentPageHtml = '';
          currentHeight = 0;
          tableHtml = `<table>${theadHtml}<tbody>` + row.outerHTML;
          tableHeight = theadHeight + 12 + rowHeight;
        }
      }
      
      // Add remaining table
      if (tableHtml !== `<table>${theadHtml}<tbody>`) {
        tableHtml += '</tbody></table>';
        currentPageHtml += tableHtml;
        currentHeight += tableHeight;
      }
    }
    // 2C: Long paragraphs - split by text
    else if (tagName === 'p' && elementHeight > EFFECTIVE_HEIGHT) {
      const text = element.textContent || '';
      const availableHeight = currentHeight > 0 ? EFFECTIVE_HEIGHT - currentHeight : EFFECTIVE_HEIGHT;
      const parts = splitLongParagraph(text, CONTENT_WIDTH, availableHeight);
      
      for (let k = 0; k < parts.length; k++) {
        const partHtml = `<p>${parts[k]}</p>`;
        const partHeight = measureElementHeight(
          Object.assign(document.createElement('p'), { innerHTML: parts[k] }),
          CONTENT_WIDTH
        );
        
        if (k === 0 && currentHeight > 0 && currentHeight + partHeight <= EFFECTIVE_HEIGHT) {
          currentPageHtml += partHtml;
          currentHeight += partHeight;
        } else if (k === 0 && currentHeight > 0) {
          // First part doesn't fit, save page and start new one
          pages.push(currentPageHtml);
          currentPageHtml = partHtml;
          currentHeight = partHeight;
        } else if (k < parts.length - 1) {
          // Middle parts go to their own pages
          if (currentPageHtml.trim()) {
            pages.push(currentPageHtml);
          }
          currentPageHtml = partHtml;
          currentHeight = partHeight;
          pages.push(currentPageHtml);
          currentPageHtml = '';
          currentHeight = 0;
        } else {
          // Last part
          if (currentPageHtml.trim()) {
            pages.push(currentPageHtml);
          }
          currentPageHtml = partHtml;
          currentHeight = partHeight;
        }
      }
    }
    // 2D: Headings and other elements - push to new page (never split)
    else {
      // Save current page if has content
      if (currentPageHtml.trim()) {
        pages.push(currentPageHtml);
      }
      
      // Start new page with this element
      currentPageHtml = element.outerHTML;
      currentHeight = Math.min(elementHeight, EFFECTIVE_HEIGHT);
    }
  }

  // Add last page if has content
  if (currentPageHtml.trim()) {
    pages.push(currentPageHtml);
  }

  document.body.removeChild(tempContainer);

  return pages.length > 0 ? pages : [''];
};

export default function SimpleWordEditor() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for pagination and margins
  const [pagesContent, setPagesContent] = useState<string[]>([]);
  const [leftMargin, setLeftMargin] = useState(DEFAULT_PADDING_HORIZONTAL);
  const [rightMargin, setRightMargin] = useState(DEFAULT_PADDING_HORIZONTAL);
  const [isRulerDragging, setIsRulerDragging] = useState(false);
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs for page elements
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load job content from Supabase on mount
  useEffect(() => {
    const loadJobContent = async () => {
      if (!jobId) {
        toast({
          title: "Error",
          description: "No se especificó un ID de trabajo",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        setIsLoading(true);
        console.log('📂 Cargando contenido del job:', jobId);

        const { data, error } = await supabase
          .from('processing_jobs')
          .select('result_html, project_title')
          .eq('id', jobId)
          .single();

        if (error) throw error;

        if (data?.result_html) {
          const cleanedHtml = cleanHtml(data.result_html);
          setProjectTitle(data.project_title || 'Documento Sin Título');
          
          // Divide content into pages
          const pages = divideContentIntoPages(cleanedHtml, leftMargin, rightMargin);
          setPagesContent(pages);
          
          console.log('✅ HTML cargado y dividido en', pages.length, 'páginas');
        } else {
          throw new Error('No se encontró contenido en el job');
        }
      } catch (error) {
        console.error('❌ Error cargando contenido:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el contenido del documento",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadJobContent();
  }, [jobId, navigate, toast]);

  // Redistribute content when margins change (on drag end)
  const redistributeContent = () => {
    const allHtml = pageRefs.current
      .filter(ref => ref !== null)
      .map(ref => ref!.innerHTML)
      .join('');
    
    const newPages = divideContentIntoPages(allHtml, leftMargin, rightMargin);
    const filteredPages = newPages.filter(page => !isPageEmpty(page));
    setPagesContent(filteredPages.length > 0 ? filteredPages : ['']);
  };

  // Handle page blur - redistribute content
  const handlePageBlur = () => {
    const allHtml = pageRefs.current
      .filter(ref => ref !== null)
      .map(ref => ref!.innerHTML)
      .join('');
    
    const newPages = divideContentIntoPages(allHtml, leftMargin, rightMargin);
    const filteredPages = newPages.filter(page => !isPageEmpty(page));
    setPagesContent(filteredPages.length > 0 ? filteredPages : ['']);
  };

  // Delete a page
  const handleDeletePage = (index: number) => {
    if (pagesContent.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "Debe haber al menos una página",
        variant: "destructive",
      });
      return;
    }
    
    const newPages = pagesContent.filter((_, i) => i !== index);
    setPagesContent(newPages);
    
    toast({
      title: "Página eliminada",
      description: `Quedan ${newPages.length} páginas`,
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!jobId) return;
    
    setIsSaving(true);
    try {
      const allHtml = pageRefs.current
        .filter(ref => ref !== null)
        .map(ref => ref!.innerHTML)
        .join('');

      const { error } = await supabase
        .from('processing_jobs')
        .update({ 
          result_html: allHtml,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "¡Guardado!",
        description: "Los cambios se han guardado correctamente",
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

  // Handle format commands
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // Handle copy all content WITH formatting (HTML)
  const handleCopyAll = async () => {
    try {
      // Collect all pages content
      const allContent = pageRefs.current
        .filter(ref => ref !== null)
        .map(ref => ref!.innerHTML)
        .join('');
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = allContent;
      
      const styledContent = applyInlineStylesForCopy(tempDiv);
      const htmlContent = styledContent.innerHTML;
      const plainText = tempDiv.textContent || '';
      
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
        description: "Pega en Word o Google Docs para mantener tablas y formato",
      });
    } catch (error) {
      console.error('Error copiando:', error);
      try {
        const plainText = pageRefs.current
          .filter(ref => ref !== null)
          .map(ref => ref!.textContent)
          .join('\n\n');
        await navigator.clipboard.writeText(plainText);
        toast({
          title: "Copiado (sin formato)",
          description: "Tu navegador no soporta copiar con formato",
        });
      } catch {
        toast({
          title: "Error",
          description: "No se pudo copiar el texto",
          variant: "destructive",
        });
      }
    }
  };

  // Wait for all images to load
  const waitForImages = (container: HTMLElement): Promise<void> => {
    const images = container.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    return Promise.all(promises).then(() => {});
  };

  // Handle PDF download - capture each page with background
  const handleDownloadPdf = async () => {
    try {
      toast({
        title: "Generando PDF...",
        description: "Por favor espera mientras se genera el archivo",
      });

      const pages = document.querySelectorAll('.word-page-container');
      if (pages.length === 0) {
        throw new Error('No hay páginas para exportar');
      }

      // Wait for all background images to load
      for (const page of Array.from(pages)) {
        await waitForImages(page as HTMLElement);
      }

      // A4 Portrait format
      const pdfWidth = 210;  // A4 width mm
      const pdfHeight = 297; // A4 height mm

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        // Capture with proper settings for background images
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null, // Transparent to show background image
          logging: false,
          imageTimeout: 30000,
          windowWidth: page.offsetWidth,
          windowHeight: page.offsetHeight,
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }
        
        // Add image maintaining exact proportions
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`${projectTitle || 'documento'}.pdf`);
      
      toast({
        title: "¡PDF generado!",
        description: `Se descargó con ${pages.length} página${pages.length > 1 ? 's' : ''}`,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sierra-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Toolbar sticky */}
      <SimpleToolbar
        onFormat={handleFormat}
        onSave={handleSave}
        onDownloadPdf={handleDownloadPdf}
        onCopyAll={handleCopyAll}
        onBack={() => navigate('/')}
        isSaving={isSaving}
        lastSaved={null}
        title={projectTitle}
      />

      {/* Ruler sticky */}
      <div className="sticky top-[108px] z-40 bg-[#f5f5f5] flex justify-center py-2">
        <SimpleRuler
          leftMargin={leftMargin}
          rightMargin={rightMargin}
          onLeftMarginChange={setLeftMargin}
          onRightMarginChange={setRightMargin}
          onDragStart={() => setIsRulerDragging(true)}
          onDragEnd={() => {
            setIsRulerDragging(false);
            redistributeContent();
          }}
          pageWidth={PAGE_WIDTH}
        />
      </div>

      {/* Pages container */}
      <div className="py-8 bg-[#f5f5f5] min-h-screen">
        <div className="flex flex-col items-center gap-8">
          {pagesContent.map((pageHtml, index) => (
            <div 
              key={index}
              className="word-page-container shadow-lg relative group"
              style={{
                width: PAGE_WIDTH,
                height: PAGE_HEIGHT,
                position: 'relative',
              }}
            >
              {/* Background image - AS Consultores template */}
              <img
                src={fondoA4Image}
                alt=""
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
              
              {/* Page content area - on top of background */}
              <div
                ref={el => pageRefs.current[index] = el}
                contentEditable
                suppressContentEditableWarning
                className="page-content-area focus:outline-none"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  paddingTop: PADDING_VERTICAL,
                  paddingBottom: PADDING_VERTICAL,
                  paddingLeft: leftMargin,
                  paddingRight: rightMargin,
                  height: PAGE_HEIGHT,
                  maxHeight: CONTENT_HEIGHT,
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  backgroundColor: 'transparent',
                }}
                onBlur={handlePageBlur}
                dangerouslySetInnerHTML={{ __html: pageHtml }}
              />
              
              {/* Delete button - visible on hover, only if more than 1 page */}
              {pagesContent.length > 1 && (
                <button
                  onClick={() => handleDeletePage(index)}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                  title="Eliminar página"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              {/* Page number */}
              <div 
                className="absolute bottom-4 right-4 text-sm text-gray-600 z-10"
                style={{ pointerEvents: 'none' }}
              >
                {index + 1} / {pagesContent.length}
              </div>

              {/* Margin guides during drag */}
              {isRulerDragging && (
                <>
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-sierra-teal opacity-50 z-20"
                    style={{ left: leftMargin }}
                  />
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-sierra-teal opacity-50 z-20"
                    style={{ right: rightMargin }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
