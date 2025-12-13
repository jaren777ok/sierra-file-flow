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
const PADDING_TOP = 120;       // Top margin - space for logos
const PADDING_BOTTOM = 60;     // Bottom margin - footer space
const DEFAULT_PADDING_HORIZONTAL = 80; // Default left/right (adjustable via ruler)
const CONTENT_HEIGHT = PAGE_HEIGHT - PADDING_TOP - PADDING_BOTTOM; // 942px

// LINE-BASED CALCULATION CONSTANTS
const LINE_HEIGHT_PX = 26;    // 11pt * 1.6 line-height ≈ 26px per line
const CHAR_WIDTH_PX = 7;      // ~7px per character at 11pt Arial
const TABLE_ROW_HEIGHT_PX = 22;  // 8pt row + padding

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
    table.setAttribute('style', 'width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 8pt;');
  });
  
  clone.querySelectorAll('th').forEach(th => {
    th.setAttribute('style', 'border: 1px solid #000; padding: 2pt 3pt; text-align: left; background-color: #f0f0f0; font-weight: 700;');
  });
  
  clone.querySelectorAll('td').forEach(td => {
    td.setAttribute('style', 'border: 1px solid #000; padding: 2pt 3pt; text-align: left;');
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
  
  // Replace <code> tags with italic quoted text
  clone.querySelectorAll('code').forEach(code => {
    const text = code.textContent || '';
    const span = document.createElement('span');
    span.style.fontStyle = 'italic';
    span.textContent = `"${text}"`;
    code.replaceWith(span);
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

// Calculate lines an element occupies based on its text content and type
const calculateElementLines = (element: HTMLElement, contentWidth: number): number => {
  const tagName = element.tagName.toLowerCase();
  const text = element.textContent || '';
  const charsPerLine = Math.floor(contentWidth / CHAR_WIDTH_PX);
  
  // Headings - estimate based on font size
  if (tagName === 'h1') {
    const h1CharsPerLine = Math.floor(contentWidth / 14); // Larger font
    return Math.ceil(text.length / h1CharsPerLine) + 2; // +2 for margins
  }
  if (tagName === 'h2') {
    const h2CharsPerLine = Math.floor(contentWidth / 10);
    return Math.ceil(text.length / h2CharsPerLine) + 2;
  }
  if (tagName === 'h3' || tagName === 'h4') {
    const h3CharsPerLine = Math.floor(contentWidth / 8);
    return Math.ceil(text.length / h3CharsPerLine) + 1;
  }
  
  // Tables - count rows
  if (tagName === 'table') {
    const rows = element.querySelectorAll('tr');
    // Each row ~1.5 lines (considering padding), + header + margins
    return Math.ceil(rows.length * 1.5) + 2;
  }
  
  // Lists - count items
  if (tagName === 'ul' || tagName === 'ol') {
    const items = element.querySelectorAll('li');
    let totalLines = 1; // margin
    items.forEach(li => {
      const liText = li.textContent || '';
      totalLines += Math.max(1, Math.ceil(liText.length / (charsPerLine - 4))); // -4 for indent
    });
    return totalLines;
  }
  
  // Paragraphs - based on text length
  if (tagName === 'p') {
    return Math.max(1, Math.ceil(text.length / charsPerLine)) + 1; // +1 for margin
  }
  
  // Default - estimate based on text
  return Math.max(1, Math.ceil(text.length / charsPerLine));
};

// Split paragraph text to fit available lines
const splitParagraphByLines = (
  text: string,
  availableLines: number,
  charsPerLine: number
): { firstPart: string; secondPart: string } => {
  const charsForFirstPart = availableLines * charsPerLine;
  
  // Find natural break point
  let cutPoint = Math.min(charsForFirstPart, text.length);
  while (cutPoint > charsForFirstPart * 0.7 && cutPoint < text.length && !/[\s.,;:!?]/.test(text[cutPoint])) {
    cutPoint--;
  }
  if (cutPoint <= charsForFirstPart * 0.7) cutPoint = charsForFirstPart;
  
  return {
    firstPart: text.substring(0, cutPoint).trim(),
    secondPart: text.substring(cutPoint).trim()
  };
};

// Split table by rows to fit available lines
const splitTableByRows = (
  table: HTMLElement,
  availableLines: number
): { firstPart: string; secondPart: string } => {
  const thead = table.querySelector('thead');
  const theadHtml = thead?.outerHTML || '';
  const headerLines = thead ? 2 : 0;
  
  const rows = Array.from(table.querySelectorAll('tbody > tr, :scope > tr:not(thead tr)'));
  const availableRowLines = availableLines - headerLines - 1; // -1 for margin
  const rowsPerLine = 1.5; // Each row takes ~1.5 lines
  const maxRows = Math.floor(availableRowLines / rowsPerLine);
  
  if (maxRows <= 0 || rows.length === 0) {
    return { firstPart: '', secondPart: table.outerHTML };
  }
  
  const firstRows = rows.slice(0, maxRows);
  const secondRows = rows.slice(maxRows);
  
  const firstPart = firstRows.length > 0 
    ? `<table>${theadHtml}<tbody>${firstRows.map(r => r.outerHTML).join('')}</tbody></table>`
    : '';
  
  const secondPart = secondRows.length > 0
    ? `<table>${theadHtml}<tbody>${secondRows.map(r => r.outerHTML).join('')}</tbody></table>`
    : '';
  
  return { firstPart, secondPart };
};

// Split list by items to fit available lines
const splitListByItems = (
  list: HTMLElement,
  availableLines: number,
  charsPerLine: number
): { firstPart: string; secondPart: string } => {
  const tagName = list.tagName.toLowerCase();
  const items = Array.from(list.querySelectorAll(':scope > li'));
  
  let currentLines = 1; // margin
  let splitIndex = 0;
  
  for (let i = 0; i < items.length; i++) {
    const itemText = items[i].textContent || '';
    const itemLines = Math.max(1, Math.ceil(itemText.length / (charsPerLine - 4)));
    
    if (currentLines + itemLines > availableLines) {
      break;
    }
    currentLines += itemLines;
    splitIndex = i + 1;
  }
  
  if (splitIndex === 0) {
    return { firstPart: '', secondPart: list.outerHTML };
  }
  
  const firstItems = items.slice(0, splitIndex);
  const secondItems = items.slice(splitIndex);
  
  const firstPart = `<${tagName}>${firstItems.map(i => i.outerHTML).join('')}</${tagName}>`;
  const secondPart = secondItems.length > 0 
    ? `<${tagName}>${secondItems.map(i => i.outerHTML).join('')}</${tagName}>`
    : '';
  
  return { firstPart, secondPart };
};

// Divide content into pages - LINE-BASED ALGORITHM
const divideContentIntoPages = (
  htmlContent: string, 
  leftMargin: number, 
  rightMargin: number
): string[] => {
  if (!htmlContent || htmlContent.trim() === '') {
    return [''];
  }

  const CONTENT_WIDTH = PAGE_WIDTH - leftMargin - rightMargin;
  const charsPerLine = Math.floor(CONTENT_WIDTH / CHAR_WIDTH_PX);
  const linesPerPage = Math.floor(CONTENT_HEIGHT / LINE_HEIGHT_PX); // ~36 lines

  // Parse HTML into elements
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = htmlContent;

  const pages: string[] = [];
  let currentPageHtml = '';
  let currentLines = 0;

  const children = Array.from(tempContainer.children);

  for (let i = 0; i < children.length; i++) {
    const element = children[i] as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    const elementLines = calculateElementLines(element, CONTENT_WIDTH);

    // CASE 1: Element fits completely in current page
    if (currentLines + elementLines <= linesPerPage) {
      currentPageHtml += element.outerHTML;
      currentLines += elementLines;
      continue;
    }

    // CASE 2: Element doesn't fit - need to split or move
    const remainingLines = linesPerPage - currentLines;

    // 2A: Paragraphs - split by text if beneficial
    if (tagName === 'p' && remainingLines >= 2) {
      const text = element.textContent || '';
      const { firstPart, secondPart } = splitParagraphByLines(text, remainingLines - 1, charsPerLine);
      
      if (firstPart) {
        currentPageHtml += `<p>${firstPart}</p>`;
        pages.push(currentPageHtml);
        currentPageHtml = secondPart ? `<p>${secondPart}</p>` : '';
        currentLines = secondPart ? Math.ceil(secondPart.length / charsPerLine) + 1 : 0;
      } else {
        // Can't split meaningfully, push whole paragraph to new page
        if (currentPageHtml.trim()) pages.push(currentPageHtml);
        currentPageHtml = element.outerHTML;
        currentLines = elementLines;
      }
    }
    // 2B: Tables - split by rows
    else if (tagName === 'table' && remainingLines >= 4) {
      const { firstPart, secondPart } = splitTableByRows(element, remainingLines);
      
      if (firstPart) {
        currentPageHtml += firstPart;
        pages.push(currentPageHtml);
        currentPageHtml = secondPart || '';
        currentLines = secondPart ? calculateElementLines(
          Object.assign(document.createElement('div'), { innerHTML: secondPart }).firstChild as HTMLElement,
          CONTENT_WIDTH
        ) : 0;
      } else {
        // Table too small to split, move to new page
        if (currentPageHtml.trim()) pages.push(currentPageHtml);
        currentPageHtml = element.outerHTML;
        currentLines = elementLines;
      }
    }
    // 2C: Lists - split by items
    else if ((tagName === 'ul' || tagName === 'ol') && remainingLines >= 2) {
      const { firstPart, secondPart } = splitListByItems(element, remainingLines, charsPerLine);
      
      if (firstPart) {
        currentPageHtml += firstPart;
        pages.push(currentPageHtml);
        currentPageHtml = secondPart || '';
        currentLines = secondPart ? calculateElementLines(
          Object.assign(document.createElement('div'), { innerHTML: secondPart }).firstChild as HTMLElement,
          CONTENT_WIDTH
        ) : 0;
      } else {
        if (currentPageHtml.trim()) pages.push(currentPageHtml);
        currentPageHtml = element.outerHTML;
        currentLines = elementLines;
      }
    }
    // 2D: Headings and other elements - never split, move to new page
    else {
      if (currentPageHtml.trim()) {
        pages.push(currentPageHtml);
      }
      currentPageHtml = element.outerHTML;
      currentLines = elementLines;
    }
  }

  // Add last page if has content
  if (currentPageHtml.trim()) {
    pages.push(currentPageHtml);
  }

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

  // Handle page blur - NO automatic redistribution to prevent infinite loops
  // User edits freely, content is saved as-is when they click Save
  const handlePageBlur = () => {
    // Do nothing - let the user edit freely without automatic redistribution
    // This prevents the infinite duplication bug when moving text between pages
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

  // Convert image to base64 using fetch (avoids CORS issues with ES6 imports)
  const imageToBase64 = async (imgSrc: string): Promise<string> => {
    const response = await fetch(imgSrc);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Handle PDF download - capture entire container with background
  const handleDownloadPdf = async () => {
    try {
      toast({
        title: "Generando PDF...",
        description: "Por favor espera mientras se genera el archivo",
      });

      const pageContainers = document.querySelectorAll('.word-page-container');
      if (pageContainers.length === 0) {
        throw new Error('No hay páginas para exportar');
      }

      // A4 Portrait format
      const pdfWidth = 210;  // A4 width mm
      const pdfHeight = 297; // A4 height mm

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Pre-convert background image to base64 using fetch
      let backgroundBase64: string | null = null;
      try {
        backgroundBase64 = await imageToBase64(fondoA4Image);
      } catch (e) {
        console.warn('Could not convert background to base64:', e);
      }

      // Process each page
      for (let i = 0; i < pageContainers.length; i++) {
        const container = pageContainers[i] as HTMLElement;
        const bgImg = container.querySelector('img') as HTMLImageElement;
        const originalSrc = bgImg?.src;

        // Temporarily replace img src with base64 for html2canvas to capture it
        if (bgImg && backgroundBase64) {
          bgImg.src = backgroundBase64;
        }

        // Wait for image src to update in DOM
        await new Promise(resolve => setTimeout(resolve, 100));

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        // Capture ENTIRE container (background image + content)
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 30000,
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
        });

        // Restore original src
        if (bgImg && originalSrc) {
          bgImg.src = originalSrc;
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`${projectTitle || 'documento'}.pdf`);
      
      toast({
        title: "¡PDF generado!",
        description: `Se descargó con ${pageContainers.length} página${pageContainers.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Intenta de nuevo.",
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
                  paddingTop: PADDING_TOP,
                  paddingBottom: PADDING_BOTTOM,
                  paddingLeft: leftMargin,
                  paddingRight: rightMargin,
                  minHeight: CONTENT_HEIGHT,
                  overflow: 'visible',
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
