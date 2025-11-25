import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SimpleToolbar } from '@/components/editors/SimpleToolbar';
import { SimpleRuler } from '@/components/editors/SimpleRuler';
import { useSimpleAutoSave } from '@/hooks/useSimpleAutoSave';
import { SimplePdfService } from '@/services/simplePdfService';
import { HtmlCleaner } from '@/utils/htmlCleaner';
import { useRealTimePageOverflow } from '@/hooks/useRealTimePageOverflow';

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
  const MAX_CONTENT_HEIGHT = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN; // 907px

  // Hook para monitoreo en tiempo real de overflow de páginas
  const { registerPageRef } = useRealTimePageOverflow({
    pages,
    onPagesChange: setPages,
    maxContentHeight: MAX_CONTENT_HEIGHT
  });

  // Función helper para dividir elementos que son muy grandes
  const divideOversizedElement = useCallback((element: Element): string[] => {
    const parts: string[] = [];
    const tagName = element.tagName.toLowerCase();
    
    // Crear div temporal para medir
    const measureDiv = document.createElement('div');
    measureDiv.style.width = `${PAGE_WIDTH - leftMargin - rightMargin}px`;
    measureDiv.style.fontFamily = 'Arial, sans-serif';
    measureDiv.style.fontSize = '11pt';
    measureDiv.style.lineHeight = '1.5';
    measureDiv.style.position = 'absolute';
    measureDiv.style.visibility = 'hidden';
    measureDiv.style.top = '-9999px';
    document.body.appendChild(measureDiv);
    
    if (tagName === 'ul' || tagName === 'ol') {
      // Dividir lista por items
      const items = Array.from(element.children);
      let currentList = `<${tagName}>`;
      
      items.forEach((item) => {
        const testList = currentList + item.outerHTML + `</${tagName}>`;
        measureDiv.innerHTML = testList;
        
        if (measureDiv.offsetHeight <= MAX_CONTENT_HEIGHT * 0.95) {
          currentList += item.outerHTML;
        } else {
          // Cerrar lista actual
          currentList += `</${tagName}>`;
          parts.push(currentList);
          // Empezar nueva lista
          currentList = `<${tagName}>${item.outerHTML}`;
        }
      });
      
      currentList += `</${tagName}>`;
      parts.push(currentList);
      
    } else if (tagName === 'table') {
      // Dividir tabla por filas
      const thead = element.querySelector('thead');
      const tbody = element.querySelector('tbody');
      const rows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
      
      let currentTable = `<table>${thead ? thead.outerHTML : ''}<tbody>`;
      
      rows.forEach((row) => {
        const testTable = currentTable + row.outerHTML + '</tbody></table>';
        measureDiv.innerHTML = testTable;
        
        if (measureDiv.offsetHeight <= MAX_CONTENT_HEIGHT * 0.95) {
          currentTable += row.outerHTML;
        } else {
          currentTable += '</tbody></table>';
          parts.push(currentTable);
          // Nueva tabla con header repetido
          currentTable = `<table>${thead ? thead.outerHTML : ''}<tbody>${row.outerHTML}`;
        }
      });
      
      currentTable += '</tbody></table>';
      parts.push(currentTable);
      
    } else if (tagName === 'p' || tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
      // Dividir párrafo/encabezado por oraciones
      const text = element.textContent || '';
      const sentences = text.split(/(?<=[.!?:;])\s+/);
      let currentText = '';
      const openTag = `<${tagName}>`;
      const closeTag = `</${tagName}>`;
      
      sentences.forEach((sentence) => {
        const testElement = `${openTag}${currentText + sentence}${closeTag}`;
        measureDiv.innerHTML = testElement;
        
        if (measureDiv.offsetHeight <= MAX_CONTENT_HEIGHT * 0.95) {
          currentText += (currentText ? ' ' : '') + sentence;
        } else {
          if (currentText) {
            parts.push(`${openTag}${currentText}${closeTag}`);
          }
          currentText = sentence;
        }
      });
      
      if (currentText) {
        parts.push(`${openTag}${currentText}${closeTag}`);
      }
    } else {
      // Para otros elementos, agregar completo
      parts.push(element.outerHTML);
    }
    
    document.body.removeChild(measureDiv);
    return parts;
  }, [leftMargin, rightMargin]);

  // Divide content into pages - NUEVO algoritmo basado en medición de altura real
  const divideContentIntoPages = useCallback((html: string): string[] => {
    if (!html) return [''];
    
    // Crear contenedor temporal EXACTO al tamaño de página real
    const tempDiv = document.createElement('div');
    tempDiv.style.width = `${PAGE_WIDTH - leftMargin - rightMargin}px`; // ancho real disponible
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '11pt';
    tempDiv.style.lineHeight = '1.5';
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);
    
    // Parsear HTML original
    const sourceDiv = document.createElement('div');
    sourceDiv.innerHTML = html;
    
    const pages: string[] = [];
    let currentPageHtml = '';
    
    // Función para medir altura actual
    const getCurrentHeight = (): number => {
      tempDiv.innerHTML = currentPageHtml;
      return tempDiv.offsetHeight;
    };
    
    // Procesar cada elemento hijo
    Array.from(sourceDiv.children).forEach((element) => {
      const elementHtml = element.outerHTML;
      
      // Intentar agregar elemento completo
      const testHtml = currentPageHtml + elementHtml;
      tempDiv.innerHTML = testHtml;
      const testHeight = tempDiv.offsetHeight;
      
      if (testHeight <= MAX_CONTENT_HEIGHT) {
        // Cabe completo - agregar
        currentPageHtml += elementHtml;
      } else {
        // NO cabe completo
        
        // Si la página actual tiene contenido, guardarla
        if (currentPageHtml.trim()) {
          pages.push(currentPageHtml);
          currentPageHtml = '';
        }
        
        // Verificar si el elemento solo es muy grande
        tempDiv.innerHTML = elementHtml;
        const soloElementHeight = tempDiv.offsetHeight;
        
        if (soloElementHeight > MAX_CONTENT_HEIGHT) {
          // Elemento individual es MUY GRANDE - dividir por contenido interno
          const divided = divideOversizedElement(element);
          divided.forEach(part => {
            currentPageHtml += part;
            if (getCurrentHeight() > MAX_CONTENT_HEIGHT * 0.95) {
              pages.push(currentPageHtml);
              currentPageHtml = '';
            }
          });
        } else {
          // Elemento cabe solo - ponerlo en nueva página
          currentPageHtml = elementHtml;
        }
      }
    });
    
    // Guardar última página
    if (currentPageHtml.trim()) {
      pages.push(currentPageHtml);
    }
    
    // Cleanup
    document.body.removeChild(tempDiv);
    
    return pages.length > 0 ? pages : [''];
  }, [leftMargin, rightMargin, divideOversizedElement]);

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
              ref={(el) => registerPageRef(index, el)}
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
                minHeight: `${MAX_CONTENT_HEIGHT}px`,
                maxHeight: `${MAX_CONTENT_HEIGHT}px`,
                overflow: 'hidden'
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
