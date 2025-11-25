import { useEffect, useState, useCallback } from 'react';
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

  // Hook para monitoreo en tiempo real de overflow de páginas (solo para edición)
  const { registerPageRef } = useRealTimePageOverflow({
    pages,
    onPagesChange: setPages,
    maxContentHeight: MAX_CONTENT_HEIGHT
  });

  // ALGORITMO PIXEL-PERFECT: Divide contenido midiendo altura exacta
  const divideContentIntoPages = useCallback((html: string): string[] => {
    if (!html) return [''];
    
    console.log('🎯 Iniciando paginación pixel-perfect...');
    
    // Crear div temporal con dimensiones exactas
    const tempContainer = document.createElement('div');
    tempContainer.style.width = `${PAGE_WIDTH - leftMargin - rightMargin}px`;
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '11pt';
    tempContainer.style.lineHeight = '1.5';
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.top = '-9999px';
    tempContainer.innerHTML = html;
    document.body.appendChild(tempContainer);
    
    const pages: string[] = [];
    const allChildren = Array.from(tempContainer.children);
    
    let currentPageHtml = '';
    let currentPageHeight = 0;
    
    for (let i = 0; i < allChildren.length; i++) {
      const element = allChildren[i] as HTMLElement;
      
      // Crear div de prueba para medir este elemento
      const testDiv = document.createElement('div');
      testDiv.style.width = `${PAGE_WIDTH - leftMargin - rightMargin}px`;
      testDiv.style.fontFamily = 'Arial, sans-serif';
      testDiv.style.fontSize = '11pt';
      testDiv.style.lineHeight = '1.5';
      testDiv.style.position = 'absolute';
      testDiv.style.visibility = 'hidden';
      testDiv.style.top = '-9999px';
      testDiv.innerHTML = currentPageHtml + element.outerHTML;
      document.body.appendChild(testDiv);
      
      const testHeight = testDiv.offsetHeight;
      document.body.removeChild(testDiv);
      
      console.log(`  Elemento ${i} (${element.tagName}): altura acumulada ${testHeight}px / ${MAX_CONTENT_HEIGHT}px`);
      
      if (testHeight <= MAX_CONTENT_HEIGHT) {
        // Cabe completo
        currentPageHtml += element.outerHTML;
        currentPageHeight = testHeight;
      } else {
        // NO cabe
        
        // Guardar página actual si tiene contenido
        if (currentPageHtml.trim()) {
          pages.push(currentPageHtml);
          console.log(`  ✅ Página ${pages.length} completada con ${currentPageHeight}px`);
          currentPageHtml = '';
          currentPageHeight = 0;
        }
        
        // Verificar si el elemento solo es muy grande
        const soloDiv = document.createElement('div');
        soloDiv.style.width = `${PAGE_WIDTH - leftMargin - rightMargin}px`;
        soloDiv.style.fontFamily = 'Arial, sans-serif';
        soloDiv.style.fontSize = '11pt';
        soloDiv.style.lineHeight = '1.5';
        soloDiv.style.position = 'absolute';
        soloDiv.style.visibility = 'hidden';
        soloDiv.style.top = '-9999px';
        soloDiv.innerHTML = element.outerHTML;
        document.body.appendChild(soloDiv);
        const soloHeight = soloDiv.offsetHeight;
        document.body.removeChild(soloDiv);
        
        if (soloHeight > MAX_CONTENT_HEIGHT) {
          // Elemento MUY GRANDE - dividir
          console.log(`  ⚠️ Elemento muy grande (${soloHeight}px) - dividiendo...`);
          const divided = divideOversizedElement(element);
          divided.forEach(part => {
            currentPageHtml += part;
            
            // Medir si esta parte llena la página
            const measureDiv = document.createElement('div');
            measureDiv.style.width = `${PAGE_WIDTH - leftMargin - rightMargin}px`;
            measureDiv.style.fontFamily = 'Arial, sans-serif';
            measureDiv.style.fontSize = '11pt';
            measureDiv.style.lineHeight = '1.5';
            measureDiv.style.position = 'absolute';
            measureDiv.style.visibility = 'hidden';
            measureDiv.style.top = '-9999px';
            measureDiv.innerHTML = currentPageHtml;
            document.body.appendChild(measureDiv);
            const partHeight = measureDiv.offsetHeight;
            document.body.removeChild(measureDiv);
            
            if (partHeight > MAX_CONTENT_HEIGHT * 0.95) {
              pages.push(currentPageHtml);
              console.log(`  ✅ Página ${pages.length} completada (elemento dividido)`);
              currentPageHtml = '';
            }
          });
        } else {
          // Elemento cabe solo en página nueva
          currentPageHtml = element.outerHTML;
          currentPageHeight = soloHeight;
        }
      }
    }
    
    // Última página
    if (currentPageHtml.trim()) {
      pages.push(currentPageHtml);
      console.log(`  ✅ Última página ${pages.length} completada`);
    }
    
    document.body.removeChild(tempContainer);
    
    console.log(`✅ Paginación completa: ${pages.length} páginas creadas`);
    return pages;
  }, [leftMargin, rightMargin, MAX_CONTENT_HEIGHT]);

  // Función para dividir elementos muy grandes
  const divideOversizedElement = (element: HTMLElement): string[] => {
    const parts: string[] = [];
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'ul' || tagName === 'ol') {
      // Dividir lista por items
      const items = Array.from(element.children);
      let currentList = `<${tagName}>`;
      
      items.forEach((item, idx) => {
        currentList += item.outerHTML;
        
        if (idx < items.length - 1 && (idx + 1) % 10 === 0) {
          // Cada 10 items, cerrar y crear nueva lista
          currentList += `</${tagName}>`;
          parts.push(currentList);
          currentList = `<${tagName}>`;
        }
      });
      
      currentList += `</${tagName}>`;
      parts.push(currentList);
      
    } else if (tagName === 'table') {
      // Dividir tabla por filas
      const thead = element.querySelector('thead');
      const rows = Array.from(element.querySelectorAll('tbody tr'));
      
      let currentTable = `<table>${thead?.outerHTML || ''}<tbody>`;
      
      rows.forEach((row, idx) => {
        currentTable += row.outerHTML;
        
        if (idx < rows.length - 1 && (idx + 1) % 15 === 0) {
          // Cada 15 filas, nueva tabla
          currentTable += '</tbody></table>';
          parts.push(currentTable);
          currentTable = `<table>${thead?.outerHTML || ''}<tbody>`;
        }
      });
      
      currentTable += '</tbody></table>';
      parts.push(currentTable);
      
    } else {
      // Dividir texto por caracteres
      const text = element.textContent || '';
      const chunkSize = 2000;
      
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.substring(i, i + chunkSize);
        parts.push(`<${tagName}>${chunk}</${tagName}>`);
      }
    }
    
    return parts.length > 0 ? parts : [element.outerHTML];
  };

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

  // Paginar contenido cuando se carga
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
