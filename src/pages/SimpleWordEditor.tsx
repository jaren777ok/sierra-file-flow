import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSimpleAutoSave } from '@/hooks/useSimpleAutoSave';
import { SimplePdfService } from '@/services/simplePdfService';
import { SimpleToolbar } from '@/components/editors/SimpleToolbar';
import { SimpleRuler } from '@/components/editors/SimpleRuler';

const PAGE_WIDTH = 793; // A4 width in pixels (21cm at 96 DPI)
const PAGE_HEIGHT = 1123; // A4 height in pixels (29.7cm at 96 DPI)
const TOP_MARGIN = 60; // ~1.6cm white space at top
const BOTTOM_MARGIN = 60; // ~1.6cm white space at bottom
const CONTENT_HEIGHT = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN; // 1003px usable area per page

// Function to clean HTML - extract only body content and remove \n literals
const cleanHtml = (rawHtml: string): string => {
  // 1. Convert \n literals (backslash + n) to actual newlines
  let cleaned = rawHtml.replace(/\\n/g, '\n');
  
  // 2. Extract content between <body> and </body>
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1].trim();
  } else {
    // If no body structure, clean DOCTYPE, html, head tags
    cleaned = cleaned
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>|<\/html>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>|<\/body>/gi, '')
      .trim();
  }
  
  // 3. Remove remaining newlines between tags (not needed in HTML)
  cleaned = cleaned.replace(/>\s*\n\s*</g, '><');
  
  return cleaned;
};

export default function SimpleWordEditor() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  const [htmlContent, setHtmlContent] = useState<string>('');
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [leftMargin, setLeftMargin] = useState(96); // 2.54cm default
  const [rightMargin, setRightMargin] = useState(96);
  const [pageCount, setPageCount] = useState(1);
  const [pagesContent, setPagesContent] = useState<string[]>([]);

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
          // Clean HTML - extract only body content
          const cleanedHtml = cleanHtml(data.result_html);
          setHtmlContent(cleanedHtml);
          setProjectTitle(data.project_title || 'Documento Sin Título');
          console.log('✅ HTML limpio cargado:', cleanedHtml.length, 'caracteres');
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

  // Distribute content across pages with intelligent splitting
  const distributeContentToPages = () => {
    if (!htmlContent) return;
    
    console.log('📐 Distribuyendo contenido en páginas (división inteligente)...');
    
    // Create temporary container to measure content
    const measureContainer = document.createElement('div');
    measureContainer.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: ${PAGE_WIDTH - leftMargin - rightMargin}px;
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      left: -9999px;
    `;
    measureContainer.innerHTML = htmlContent;
    document.body.appendChild(measureContainer);
    
    const pages: string[] = [];
    let currentPageContent = '';
    let currentPageHeight = 0;
    
    // Helper to start a new page
    const startNewPage = () => {
      if (currentPageContent) {
        pages.push(currentPageContent);
      }
      currentPageContent = '';
      currentPageHeight = 0;
    };
    
    // Get all top-level block elements
    const topLevelElements = Array.from(measureContainer.children);
    
    topLevelElements.forEach((element) => {
      const el = element as HTMLElement;
      const elementHeight = el.offsetHeight;
      const tagName = el.tagName.toLowerCase();
      
      // If element fits completely in current page
      if (currentPageHeight + elementHeight <= CONTENT_HEIGHT) {
        currentPageContent += el.outerHTML;
        currentPageHeight += elementHeight;
        return;
      }
      
      // Element doesn't fit - decide whether to split or move
      const spaceRemaining = CONTENT_HEIGHT - currentPageHeight;
      
      // INTELLIGENT SPLITTING LOGIC
      
      // 1. LISTS (ul, ol) - Split by <li> items
      if (tagName === 'ul' || tagName === 'ol') {
        const listItems = Array.from(el.querySelectorAll(':scope > li'));
        
        if (listItems.length > 0 && spaceRemaining > 50) {
          // Create partial list for current page
          let partialList = `<${tagName}>`;
          let partialHeight = 0;
          let itemsAdded = 0;
          
          for (const li of listItems) {
            const liEl = li as HTMLElement;
            const liHeight = liEl.offsetHeight;
            
            if (currentPageHeight + partialHeight + liHeight <= CONTENT_HEIGHT) {
              partialList += liEl.outerHTML;
              partialHeight += liHeight;
              itemsAdded++;
            } else {
              break;
            }
          }
          
          // If at least one item fits, add partial list
          if (itemsAdded > 0) {
            partialList += `</${tagName}>`;
            currentPageContent += partialList;
            currentPageHeight += partialHeight;
            
            // Start new page with remaining items
            startNewPage();
            
            const remainingItems = listItems.slice(itemsAdded);
            if (remainingItems.length > 0) {
              let remainingList = `<${tagName}>`;
              remainingItems.forEach(li => {
                remainingList += (li as HTMLElement).outerHTML;
              });
              remainingList += `</${tagName}>`;
              
              currentPageContent = remainingList;
              // Measure remaining height
              const tempDiv = document.createElement('div');
              tempDiv.style.cssText = measureContainer.style.cssText;
              tempDiv.innerHTML = remainingList;
              document.body.appendChild(tempDiv);
              currentPageHeight = tempDiv.offsetHeight;
              document.body.removeChild(tempDiv);
            }
          } else {
            // No items fit - move entire list to new page
            startNewPage();
            currentPageContent = el.outerHTML;
            currentPageHeight = elementHeight;
          }
        } else {
          // List too short or no space - move complete
          startNewPage();
          currentPageContent = el.outerHTML;
          currentPageHeight = elementHeight;
        }
        return;
      }
      
      // 2. TABLES - Split by <tr> rows
      if (tagName === 'table') {
        const tbody = el.querySelector('tbody');
        const rows = Array.from(el.querySelectorAll('tbody tr, tr'));
        const thead = el.querySelector('thead');
        const theadHtml = thead ? thead.outerHTML : '';
        
        if (rows.length > 1 && spaceRemaining > 80) {
          // Measure header height
          let headerHeight = 0;
          if (thead) {
            const tempHeader = document.createElement('table');
            tempHeader.innerHTML = theadHtml;
            measureContainer.appendChild(tempHeader);
            headerHeight = tempHeader.offsetHeight;
            measureContainer.removeChild(tempHeader);
          }
          
          let partialTable = '<table>' + theadHtml + '<tbody>';
          let partialHeight = headerHeight;
          let rowsAdded = 0;
          
          // Get only body rows
          const bodyRows = tbody ? Array.from(tbody.querySelectorAll('tr')) : rows;
          
          for (const row of bodyRows) {
            const rowEl = row as HTMLElement;
            const rowHeight = rowEl.offsetHeight;
            
            if (currentPageHeight + partialHeight + rowHeight <= CONTENT_HEIGHT) {
              partialTable += rowEl.outerHTML;
              partialHeight += rowHeight;
              rowsAdded++;
            } else {
              break;
            }
          }
          
          if (rowsAdded > 0) {
            partialTable += '</tbody></table>';
            currentPageContent += partialTable;
            currentPageHeight += partialHeight;
            
            // Start new page with remaining rows
            startNewPage();
            
            const remainingRows = bodyRows.slice(rowsAdded);
            if (remainingRows.length > 0) {
              let remainingTable = '<table>' + theadHtml + '<tbody>';
              remainingRows.forEach(row => {
                remainingTable += (row as HTMLElement).outerHTML;
              });
              remainingTable += '</tbody></table>';
              
              currentPageContent = remainingTable;
              // Measure remaining height
              const tempTable = document.createElement('div');
              tempTable.style.cssText = measureContainer.style.cssText;
              tempTable.innerHTML = remainingTable;
              document.body.appendChild(tempTable);
              currentPageHeight = tempTable.offsetHeight;
              document.body.removeChild(tempTable);
            }
          } else {
            startNewPage();
            currentPageContent = el.outerHTML;
            currentPageHeight = elementHeight;
          }
        } else {
          startNewPage();
          currentPageContent = el.outerHTML;
          currentPageHeight = elementHeight;
        }
        return;
      }
      
      // 3. HEADINGS (h1-h4) - NEVER split, always move complete
      if (['h1', 'h2', 'h3', 'h4'].includes(tagName)) {
        startNewPage();
        currentPageContent = el.outerHTML;
        currentPageHeight = elementHeight;
        return;
      }
      
      // 4. OTHER ELEMENTS (p, blockquote, hr, etc.) - Move complete
      startNewPage();
      currentPageContent = el.outerHTML;
      currentPageHeight = elementHeight;
    });
    
    // Add last page
    if (currentPageContent) {
      pages.push(currentPageContent);
    }
    
    // Clean up
    document.body.removeChild(measureContainer);
    
    // Update state
    setPagesContent(pages);
    setPageCount(pages.length);
    console.log(`✅ Contenido distribuido en ${pages.length} páginas (división inteligente)`);
  };

  // Distribute content after loading
  useEffect(() => {
    if (htmlContent) {
      const timer = setTimeout(() => {
        distributeContentToPages();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [htmlContent]);

  // Redistribute when margins change
  useEffect(() => {
    if (htmlContent) {
      const timer = setTimeout(() => {
        distributeContentToPages();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [leftMargin, rightMargin]);

  // Get current content from all pages combined
  const getCurrentContent = () => {
    // Combine all pages content
    return pagesContent.join('');
  };

  // Handle content change in a specific page
  const handlePageContentChange = (pageIndex: number, newContent: string) => {
    const newPages = [...pagesContent];
    newPages[pageIndex] = newContent;
    setPagesContent(newPages);
    
    // Update full HTML content
    const fullContent = newPages.join('');
    setHtmlContent(fullContent);
  };

  // Manual save hook
  const { isSaving, lastSaved, saveNow } = useSimpleAutoSave(jobId || '', getCurrentContent);

  // Handle format commands
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    try {
      console.log('📄 Generando PDF...');
      await SimplePdfService.generatePdf(`${projectTitle}.pdf`);
      toast({
        title: "¡PDF Generado!",
        description: "El documento se descargó correctamente",
      });
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
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
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <SimpleToolbar
          onFormat={handleFormat}
          onSave={saveNow}
          onDownloadPdf={handleDownloadPdf}
          onBack={() => navigate('/')}
          isSaving={isSaving}
          lastSaved={lastSaved}
          title={projectTitle}
        />
      </div>

      {/* Ruler sticky */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-gray-200">
        <SimpleRuler
          pageWidth={PAGE_WIDTH}
          leftMargin={leftMargin}
          rightMargin={rightMargin}
          onLeftMarginChange={setLeftMargin}
          onRightMarginChange={setRightMargin}
        />
      </div>

      {/* Main content area with real pages */}
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="mx-auto" style={{ width: `${PAGE_WIDTH}px` }}>
          {/* Render each page as a real container */}
          {pagesContent.map((pageContent, pageIndex) => (
            <div 
              key={pageIndex}
              className="page-container bg-white shadow-lg mb-6 relative"
              style={{
                width: `${PAGE_WIDTH}px`,
                height: `${PAGE_HEIGHT}px`,
                overflow: 'hidden',
              }}
            >
              {/* Page number indicator */}
              <span className="absolute top-2 right-4 text-xs text-gray-400 z-30" style={{ fontFamily: 'Arial, sans-serif' }}>
                Página {pageIndex + 1}
              </span>
              
              {/* Content area with real margins (no visual strips) */}
              <div
                className="page-content-area absolute"
                style={{
                  top: `${TOP_MARGIN}px`,
                  left: `${leftMargin}px`,
                  right: `${rightMargin}px`,
                  height: `${CONTENT_HEIGHT}px`,
                  overflow: 'hidden',
                }}
              >
                <div
                  ref={pageIndex === 0 ? contentRef : null}
                  contentEditable
                  suppressContentEditableWarning
                  className="focus:outline-none h-full"
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '11pt',
                    lineHeight: '1.6',
                    color: '#000',
                  }}
                  dangerouslySetInnerHTML={{ __html: pageContent }}
                  onBlur={(e) => handlePageContentChange(pageIndex, e.currentTarget.innerHTML)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global styles for professional HTML rendering */}
      <style>{`
        /* Base styles for content within pages */
        .page-content-area {
          font-family: Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #000;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        /* H1 - Main Document Title */
        .page-content-area h1 {
          font-size: 24pt;
          font-weight: 800;
          margin: 24pt 0 16pt 0;
          color: #000;
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 8pt;
        }

        /* H2 - Main Sections */
        .page-content-area h2 {
          font-size: 16pt;
          font-weight: 700;
          margin: 20pt 0 10pt 0;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
        }

        /* H3 - Subsections */
        .page-content-area h3 {
          font-size: 13pt;
          font-weight: 700;
          margin: 14pt 0 8pt 0;
          color: #000;
          text-transform: uppercase;
        }

        /* H4 - Sub-subsections */
        .page-content-area h4 {
          font-size: 12pt;
          font-weight: 600;
          margin: 12pt 0 6pt 0;
          color: #333;
        }

        /* Paragraphs */
        .page-content-area p {
          margin-bottom: 8pt;
          text-align: justify;
        }

        /* Lists with bullets - three levels */
        .page-content-area ul {
          list-style-type: disc;
          padding-left: 24pt;
          margin-bottom: 8pt;
        }

        .page-content-area ul ul {
          list-style-type: circle;
          margin-top: 4pt;
          margin-bottom: 4pt;
        }

        .page-content-area ul ul ul {
          list-style-type: square;
        }

        /* Ordered lists */
        .page-content-area ol {
          list-style-type: decimal;
          padding-left: 24pt;
          margin-bottom: 8pt;
        }

        .page-content-area ol ol {
          list-style-type: lower-alpha;
          margin-top: 4pt;
        }

        .page-content-area ol ol ol {
          list-style-type: lower-roman;
        }

        /* List items */
        .page-content-area li {
          margin-bottom: 4pt;
          line-height: 1.5;
        }

        /* Strong/Bold */
        .page-content-area strong {
          font-weight: 700;
          color: #000;
        }

        /* Emphasis/Italic */
        .page-content-area em {
          font-style: italic;
          text-decoration: underline;
        }

        /* Professional tables */
        .page-content-area table {
          width: 100%;
          border-collapse: collapse;
          margin: 12pt 0;
          font-size: 10pt;
        }

        .page-content-area th {
          background-color: #f0f0f0;
          font-weight: bold;
          border: 1px solid #333;
          padding: 6pt 8pt;
          text-align: left;
        }

        .page-content-area td {
          border: 1px solid #666;
          padding: 6pt 8pt;
        }

        /* Horizontal rules */
        .page-content-area hr {
          border: none;
          border-top: 1px solid #333;
          margin: 12pt 0;
        }

        /* Blockquotes */
        .page-content-area blockquote {
          border-left: 3px solid #2A656F;
          padding-left: 12pt;
          margin-left: 0;
          margin-bottom: 8pt;
          color: #666;
        }

        /* Code blocks */
        .page-content-area code {
          background-color: #f5f5f5;
          padding: 2pt 4pt;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 10pt;
        }

        .page-content-area pre {
          background-color: #f5f5f5;
          padding: 12pt;
          border-radius: 4px;
          overflow-x: auto;
          margin-bottom: 12pt;
        }

        .page-content-area pre code {
          background-color: transparent;
          padding: 0;
        }
      `}</style>
    </div>
  );
}