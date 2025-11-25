import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SimpleToolbar } from '@/components/editors/SimpleToolbar';
import { SimpleRuler } from '@/components/editors/SimpleRuler';
import { useSimpleAutoSave } from '@/hooks/useSimpleAutoSave';
import { SimplePdfService } from '@/services/simplePdfService';
import { HtmlCleaner } from '@/utils/htmlCleaner';

const SimpleWordEditor = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [projectTitle, setProjectTitle] = useState('Documento');
  const [isLoading, setIsLoading] = useState(true);
  const [leftMargin, setLeftMargin] = useState(96); // ~2.54cm default
  const [rightMargin, setRightMargin] = useState(96);
  
  const PAGE_WIDTH = 793; // 21cm en px
  const PAGE_HEIGHT = 1123; // 29.7cm en px
  const TOP_MARGIN = 96; // 2.54cm margen superior
  const BOTTOM_MARGIN = 120; // 3.17cm margen inferior (más espacio)
  const CHARS_PER_PAGE = 2400; // ~30-35 líneas de texto por página (conservador para respetar márgenes)

  // Divide content into pages - unified algorithm that splits everything naturally
  const divideContentIntoPages = useCallback((html: string): string[] => {
    if (!html) return [''];
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const pages: string[] = [];
    let currentPageHtml = '';
    let currentCharCount = 0;
    
    // Helper to start new page
    const startNewPage = () => {
      if (currentPageHtml.trim()) {
        pages.push(currentPageHtml);
      }
      currentPageHtml = '';
      currentCharCount = 0;
    };
    
    // Split paragraph by sentences
    const splitParagraph = (element: Element) => {
      const text = element.textContent || '';
      const sentences = text.split(/(?<=[.!?:;])\s+/);
      let currentSentences = '';
      
      sentences.forEach((sentence) => {
        const testLength = currentCharCount + currentSentences.length + sentence.length;
        
        if (testLength <= CHARS_PER_PAGE) {
          currentSentences += (currentSentences ? ' ' : '') + sentence;
        } else {
          // Save what we have so far
          if (currentSentences.trim()) {
            currentPageHtml += `<p>${currentSentences.trim()}</p>`;
          }
          startNewPage();
          currentSentences = sentence;
        }
      });
      
      // Add remaining sentences
      if (currentSentences.trim()) {
        currentPageHtml += `<p>${currentSentences.trim()}</p>`;
        currentCharCount += currentSentences.length;
      }
    };
    
    // Split list by items (handles nested lists)
    const splitList = (element: Element) => {
      const tagName = element.tagName.toLowerCase();
      const items = Array.from(element.children);
      let currentListHtml = `<${tagName}>`;
      let currentListChars = 0;
      
      items.forEach((item) => {
        const hasNestedList = item.querySelector('ul, ol') !== null;
        const itemTextLength = item.textContent?.length || 0;
        
        if (hasNestedList) {
          const itemClone = item.cloneNode(true) as Element;
          const nestedLists = itemClone.querySelectorAll('ul, ol');
          nestedLists.forEach(list => list.remove());
          
          if (currentCharCount + currentListChars + itemTextLength <= CHARS_PER_PAGE) {
            currentListHtml += item.outerHTML;
            currentListChars += itemTextLength;
          } else {
            currentListHtml += `</${tagName}>`;
            currentPageHtml += currentListHtml;
            startNewPage();
            currentListHtml = `<${tagName}>${item.outerHTML}`;
            currentListChars = itemTextLength;
          }
        } else {
          const testLength = currentCharCount + currentListChars + itemTextLength;
          
          if (testLength <= CHARS_PER_PAGE) {
            currentListHtml += item.outerHTML;
            currentListChars += itemTextLength;
          } else {
            currentListHtml += `</${tagName}>`;
            currentPageHtml += currentListHtml;
            startNewPage();
            currentListHtml = `<${tagName}>${item.outerHTML}`;
            currentListChars = itemTextLength;
          }
        }
      });
      
      currentListHtml += `</${tagName}>`;
      currentPageHtml += currentListHtml;
      currentCharCount += currentListChars;
    };
    
    // Split individual list item by sentences
    const splitListItem = (element: Element) => {
      const itemText = element.textContent || '';
      const itemLength = itemText.length;
      
      if (currentCharCount + itemLength <= CHARS_PER_PAGE) {
        currentPageHtml += element.outerHTML;
        currentCharCount += itemLength;
        return;
      }
      
      const sentences = itemText.split(/(?<=[.!?:;])\s+/);
      let currentSentences = '';
      
      sentences.forEach((sentence) => {
        if (currentCharCount + currentSentences.length + sentence.length <= CHARS_PER_PAGE) {
          currentSentences += (currentSentences ? ' ' : '') + sentence;
        } else {
          if (currentSentences.trim()) {
            currentPageHtml += `<li>${currentSentences.trim()}</li>`;
          }
          startNewPage();
          currentSentences = sentence;
        }
      });
      
      if (currentSentences.trim()) {
        currentPageHtml += `<li>${currentSentences.trim()}</li>`;
        currentCharCount += currentSentences.length;
      }
    };
    
    // Split table by rows
    const splitTable = (element: Element) => {
      const rows = Array.from(element.querySelectorAll('tr'));
      let currentTableHtml = '<table>';
      let currentTableChars = 0;
      let headerRow = '';
      
      rows.forEach((row, index) => {
        const rowLength = row.textContent?.length || 0;
        const isHeader = row.querySelector('th') !== null;
        
        // Save header to repeat on each page
        if (isHeader && index === 0) {
          headerRow = row.outerHTML;
        }
        
        const testLength = currentCharCount + currentTableChars + rowLength;
        
        if (testLength <= CHARS_PER_PAGE) {
          currentTableHtml += row.outerHTML;
          currentTableChars += rowLength;
        } else {
          // Close current table and save page
          currentTableHtml += '</table>';
          currentPageHtml += currentTableHtml;
          startNewPage();
          // Start new table (with header if exists and this isn't the header)
          currentTableHtml = '<table>' + (headerRow && !isHeader ? headerRow : '') + row.outerHTML;
          currentTableChars = rowLength + (headerRow && !isHeader ? rows[0].textContent?.length || 0 : 0);
        }
      });
      
      // Add remaining table
      currentTableHtml += '</table>';
      currentPageHtml += currentTableHtml;
      currentCharCount += currentTableChars;
    };
    
    // Process element recursively
    const processElement = (element: Element) => {
      const tagName = element.tagName.toUpperCase();
      const elementTextLength = element.textContent?.length || 0;

      if (currentCharCount + elementTextLength <= CHARS_PER_PAGE) {
        currentPageHtml += element.outerHTML;
        currentCharCount += elementTextLength;
        return;
      }

      switch (tagName) {
        case 'P':
          splitParagraph(element);
          break;
        
        case 'UL':
        case 'OL':
          splitList(element);
          break;
        
        case 'TABLE':
          splitTable(element);
          break;
        
        case 'LI':
          splitListItem(element);
          break;
        
        default:
          if (currentPageHtml.trim()) {
            startNewPage();
          }
          currentPageHtml = element.outerHTML;
          currentCharCount = elementTextLength;
          break;
      }
    };
    
    // Process each element
    Array.from(tempDiv.children).forEach(processElement);
    
    // Add last page
    if (currentPageHtml.trim()) {
      pages.push(currentPageHtml);
    }
    
    return pages.length > 0 ? pages : [''];
  }, []);

  // Load initial content from Supabase
  useEffect(() => {
    const loadJobContent = async () => {
      if (!jobId) return;

      try {
        const { data, error } = await supabase
          .from('processing_jobs')
          .select('result_html, project_title')
          .eq('id', jobId)
          .single();

        if (error) throw error;

        if (data) {
          // Limpiar HTML antes de renderizar
          const cleanedHtml = HtmlCleaner.cleanHtmlFromWebhook(data.result_html || '');
          setContent(cleanedHtml);
          setProjectTitle(data.project_title || 'Documento');
        }
      } catch (error) {
        console.error('Error loading content:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el documento",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadJobContent();
  }, [jobId, toast]);

  // Divide content into pages ONLY on initial load
  useEffect(() => {
    if (content && pages.length === 0) {
      const dividedPages = divideContentIntoPages(content);
      setPages(dividedPages);
    }
  }, [content, divideContentIntoPages, pages.length]);

  // Function to get current content from all pages
  const getCurrentContent = useCallback(() => {
    return pages.join(''); // Join without separator to maintain HTML integrity
  }, [pages]);

  // Manual save hook
  const { isSaving, lastSaved, saveNow } = useSimpleAutoSave(jobId || '', getCurrentContent);

  // Format text
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    try {
      await SimplePdfService.generatePdf(`${projectTitle}.pdf`);
      toast({
        title: "PDF Generado",
        description: "El documento se ha descargado correctamente",
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

  // Handle content changes from any page
  const handlePageContentChange = (pageIndex: number, newContent: string) => {
    setPages(prevPages => {
      const updatedPages = [...prevPages];
      updatedPages[pageIndex] = newContent;
      return updatedPages;
    });
    // Don't update content state - this prevents re-pagination
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sierra-teal mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando documento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <SimpleToolbar
        onFormat={handleFormat}
        onSave={saveNow}
        onDownloadPdf={handleDownloadPdf}
        onBack={() => navigate('/saved-files')}
        isSaving={isSaving}
        lastSaved={lastSaved}
        title={projectTitle}
      />

      <SimpleRuler
        leftMargin={leftMargin}
        rightMargin={rightMargin}
        onLeftMarginChange={setLeftMargin}
        onRightMarginChange={setRightMargin}
        pageWidth={PAGE_WIDTH}
      />

      {/* Contenedor de páginas A4 */}
      <div className="flex flex-col items-center gap-6 py-8">
        {pages.map((pageContent, index) => (
          <div
            key={index}
            className="word-page bg-white shadow-lg"
            data-page={index + 1}
            style={{
              width: `${PAGE_WIDTH}px`,
              height: `${PAGE_HEIGHT}px`,
              paddingTop: `${TOP_MARGIN}px`,
              paddingBottom: `${BOTTOM_MARGIN}px`,
              paddingLeft: `${leftMargin}px`,
              paddingRight: `${rightMargin}px`
            }}
          >
            <div
              contentEditable
              suppressContentEditableWarning
              className="outline-none
                         [&_h1]:text-[18pt] [&_h1]:font-bold [&_h1]:mb-[12pt] [&_h1]:text-gray-900
                         [&_h2]:text-[14pt] [&_h2]:font-bold [&_h2]:mb-[10pt] [&_h2]:text-gray-900
                         [&_h3]:text-[12pt] [&_h3]:font-bold [&_h3]:mb-[8pt] [&_h3]:text-gray-900
                         [&_h4]:text-[11pt] [&_h4]:font-semibold [&_h4]:mb-[6pt] [&_h4]:text-gray-900
                         [&_p]:text-[11pt] [&_p]:mb-[8pt] [&_p]:leading-[1.5] [&_p]:text-gray-800
                         [&_ul]:list-disc [&_ul]:ml-[20pt] [&_ul]:mb-[8pt]
                         [&_ol]:list-decimal [&_ol]:ml-[20pt] [&_ol]:mb-[8pt]
                         [&_li]:text-[11pt] [&_li]:mb-[4pt] [&_li]:text-gray-800
                         [&_table]:border-collapse [&_table]:w-full [&_table]:mb-[12pt]
                         [&_td]:border [&_td]:border-gray-300 [&_td]:p-[6pt] [&_td]:text-[11pt] [&_td]:text-gray-800
                         [&_th]:border [&_th]:border-gray-300 [&_th]:p-[6pt] [&_th]:bg-gray-100 [&_th]:font-bold [&_th]:text-[11pt] [&_th]:text-gray-900
                         [&_strong]:font-bold [&_em]:italic [&_u]:underline
                         text-[11pt] leading-[1.5] font-['Arial',sans-serif]"
              style={{
                height: `${PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN}px`,
                maxHeight: `${PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN}px`,
                overflow: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: pageContent }}
              onInput={(e) => handlePageContentChange(index, e.currentTarget.innerHTML)}
              onBlur={(e) => handlePageContentChange(index, e.currentTarget.innerHTML)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleWordEditor;
