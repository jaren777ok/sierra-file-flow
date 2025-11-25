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

  // Hook para monitoreo en tiempo real de overflow de páginas (TEMPORALMENTE DESACTIVADO)
  // const { registerPageRef } = useRealTimePageOverflow({
  //   pages,
  //   onPagesChange: setPages,
  //   maxContentHeight: MAX_CONTENT_HEIGHT
  // });

  // Helper: Medir altura real de un elemento
  const measureHeight = useCallback((element: Element, container: HTMLElement): number => {
    const testDiv = document.createElement('div');
    testDiv.id = 'temp-measure-container';
    testDiv.style.width = `${PAGE_WIDTH - leftMargin - rightMargin}px`;
    testDiv.style.position = 'absolute';
    testDiv.style.visibility = 'hidden';
    testDiv.style.top = '-9999px';
    testDiv.appendChild(element.cloneNode(true));
    document.body.appendChild(testDiv);
    const height = testDiv.offsetHeight;
    document.body.removeChild(testDiv);
    return height;
  }, [PAGE_WIDTH, leftMargin, rightMargin]);

  // Helper: Dividir elementos grandes (tablas, listas, párrafos)
  const divideElement = useCallback((
    element: Element,
    availableHeight: number
  ): { fitsPart: string; remainderPart: string } | null => {
    const tagName = element.tagName.toLowerCase();
    
    // TABLAS: dividir por filas
    if (tagName === 'table') {
      const thead = element.querySelector('thead');
      const tbody = element.querySelector('tbody') || element;
      const rows = Array.from(tbody.querySelectorAll('tr'));
      
      if (rows.length === 0) return null;
      
      let fitCount = 0;
      for (let i = 1; i <= rows.length; i++) {
        const testTable = document.createElement('table');
        testTable.className = element.className;
        if (thead) testTable.appendChild(thead.cloneNode(true));
        const testBody = document.createElement('tbody');
        rows.slice(0, i).forEach(row => testBody.appendChild(row.cloneNode(true)));
        testTable.appendChild(testBody);
        
        const height = measureHeight(testTable, document.body);
        if (height <= availableHeight) {
          fitCount = i;
        } else {
          break;
        }
      }
      
      if (fitCount === 0) return null;
      
      const fitsTable = document.createElement('table');
      fitsTable.className = element.className;
      if (thead) fitsTable.appendChild(thead.cloneNode(true));
      const fitsBody = document.createElement('tbody');
      rows.slice(0, fitCount).forEach(row => fitsBody.appendChild(row.cloneNode(true)));
      fitsTable.appendChild(fitsBody);
      
      const remainderTable = document.createElement('table');
      remainderTable.className = element.className;
      if (thead) remainderTable.appendChild(thead.cloneNode(true));
      const remainderBody = document.createElement('tbody');
      rows.slice(fitCount).forEach(row => remainderBody.appendChild(row.cloneNode(true)));
      remainderTable.appendChild(remainderBody);
      
      return {
        fitsPart: fitsTable.outerHTML,
        remainderPart: remainderTable.outerHTML
      };
    }
    
    // LISTAS: dividir por items
    if (tagName === 'ul' || tagName === 'ol') {
      const items = Array.from(element.querySelectorAll('li'));
      if (items.length === 0) return null;
      
      let fitCount = 0;
      for (let i = 1; i <= items.length; i++) {
        const testList = document.createElement(tagName);
        testList.className = element.className;
        items.slice(0, i).forEach(item => testList.appendChild(item.cloneNode(true)));
        
        const height = measureHeight(testList, document.body);
        if (height <= availableHeight) {
          fitCount = i;
        } else {
          break;
        }
      }
      
      if (fitCount === 0) return null;
      
      const fitsList = document.createElement(tagName);
      fitsList.className = element.className;
      items.slice(0, fitCount).forEach(item => fitsList.appendChild(item.cloneNode(true)));
      
      const remainderList = document.createElement(tagName);
      remainderList.className = element.className;
      items.slice(fitCount).forEach(item => remainderList.appendChild(item.cloneNode(true)));
      
      return {
        fitsPart: fitsList.outerHTML,
        remainderPart: remainderList.outerHTML
      };
    }
    
    // PÁRRAFOS/TÍTULOS: dividir por oraciones
    if (['p', 'h1', 'h2', 'h3', 'h4'].includes(tagName)) {
      const text = element.textContent || '';
      const sentences = text.split(/(?<=[.!?])\s+/);
      
      if (sentences.length <= 1) return null;
      
      let fitCount = 0;
      for (let i = 1; i <= sentences.length; i++) {
        const testElement = document.createElement(tagName);
        testElement.className = element.className;
        testElement.innerHTML = element.innerHTML; // Preserve inner HTML
        testElement.textContent = sentences.slice(0, i).join(' ');
        
        const height = measureHeight(testElement, document.body);
        if (height <= availableHeight) {
          fitCount = i;
        } else {
          break;
        }
      }
      
      if (fitCount === 0) return null;
      
      const fitsElement = document.createElement(tagName);
      fitsElement.className = element.className;
      fitsElement.textContent = sentences.slice(0, fitCount).join(' ');
      
      const remainderElement = document.createElement(tagName);
      remainderElement.className = element.className;
      remainderElement.textContent = sentences.slice(fitCount).join(' ');
      
      return {
        fitsPart: fitsElement.outerHTML,
        remainderPart: remainderElement.outerHTML
      };
    }
    
    return null;
  }, [measureHeight]);

  // ALGORITMO DE LLENADO MÁXIMO: Llena páginas al 95-98% sin espacios en blanco
  const divideContentIntoPages = useCallback((html: string): string[] => {
    if (!html) return [''];
    
    console.log('🎯 Iniciando paginación INTELIGENTE con división de elementos grandes...');
    
    // Crear contenedor temporal con estilos CSS completos
    const tempContainer = document.createElement('div');
    tempContainer.style.width = `${PAGE_WIDTH - leftMargin - rightMargin}px`;
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '11pt';
    tempContainer.style.lineHeight = '1.5';
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.top = '-9999px';
    
    // Aplicar TODOS los estilos CSS del editor
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      #temp-measure-container h1 { font-size: 18pt; font-weight: bold; margin-bottom: 12pt; }
      #temp-measure-container h2 { font-size: 14pt; font-weight: bold; margin-bottom: 10pt; }
      #temp-measure-container h3 { font-size: 12pt; font-weight: bold; margin-bottom: 8pt; }
      #temp-measure-container p { font-size: 11pt; margin-bottom: 8pt; line-height: 1.5; }
      #temp-measure-container ul { list-style-type: disc; margin-left: 20pt; margin-bottom: 8pt; }
      #temp-measure-container ol { list-style-type: decimal; margin-left: 20pt; margin-bottom: 8pt; }
      #temp-measure-container li { font-size: 11pt; margin-bottom: 4pt; }
      #temp-measure-container table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; }
      #temp-measure-container td { border: 1px solid #d1d5db; padding: 6pt; font-size: 11pt; }
      #temp-measure-container th { border: 1px solid #d1d5db; padding: 6pt; background: #f3f4f6; font-weight: bold; }
      #temp-measure-container strong { font-weight: bold; }
      #temp-measure-container em { font-style: italic; }
      #temp-measure-container u { text-decoration: underline; }
    `;
    document.head.appendChild(styleSheet);
    
    tempContainer.id = 'temp-measure-container';
    tempContainer.innerHTML = html;
    document.body.appendChild(tempContainer);
    
    const pages: string[] = [];
    const allElements = Array.from(tempContainer.children).map(el => el.outerHTML);
    
    let currentPageHtml = '';
    let currentPageHeight = 0;
    let i = 0;
    
    console.log(`📋 Total elementos a procesar: ${allElements.length}`);
    
    while (i < allElements.length) {
      // Crear elemento temporal desde HTML string
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = allElements[i];
      const element = tempDiv.firstElementChild!;
      
      const elementHeight = measureHeight(element, tempContainer);
      const spaceLeft = MAX_CONTENT_HEIGHT - currentPageHeight;
      
      // CASO 1: Elemento cabe completo
      if (elementHeight <= spaceLeft) {
        currentPageHtml += allElements[i];
        currentPageHeight += elementHeight;
        i++;
        console.log(`  ✅ Elemento ${i} agregado (${currentPageHeight}px / ${MAX_CONTENT_HEIGHT}px)`);
      }
      // CASO 2: Elemento NO cabe completo
      else {
        // Si hay espacio disponible (>100px), intentar dividir
        if (currentPageHtml.trim() && spaceLeft > 100) {
          const divided = divideElement(element, spaceLeft);
          
          if (divided && divided.fitsPart.trim()) {
            currentPageHtml += divided.fitsPart;
            console.log(`  ✂️ Elemento ${i + 1} DIVIDIDO - parte agregada a página ${pages.length + 1}`);
            
            // Reemplazar con la parte restante para siguiente iteración
            allElements[i] = divided.remainderPart;
            
            // Finalizar página actual
            pages.push(currentPageHtml);
            console.log(`  📄 Página ${pages.length} completa: ${currentPageHeight}px`);
            currentPageHtml = '';
            currentPageHeight = 0;
          } else {
            // No se pudo dividir - finalizar página y mover elemento completo
            pages.push(currentPageHtml);
            console.log(`  📄 Página ${pages.length} completa: ${currentPageHeight}px`);
            currentPageHtml = allElements[i];
            currentPageHeight = elementHeight;
            i++;
          }
        }
        // Si página vacía, agregar elemento completo (aunque sea grande)
        else {
          currentPageHtml = allElements[i];
          currentPageHeight = elementHeight;
          i++;
          
          if (elementHeight > MAX_CONTENT_HEIGHT) {
            console.log(`  ⚠️ Elemento ${i} muy grande (${elementHeight}px) - página propia`);
            pages.push(currentPageHtml);
            console.log(`  📄 Página ${pages.length} (overflow): ${elementHeight}px`);
            currentPageHtml = '';
            currentPageHeight = 0;
          } else {
            console.log(`  📄 Nueva página iniciada con elemento ${i}`);
          }
        }
      }
      
      // Límite de seguridad
      if (pages.length > 200) {
        console.warn('⚠️ Límite de 200 páginas alcanzado');
        break;
      }
    }
    
    // Agregar última página
    if (currentPageHtml.trim()) {
      pages.push(currentPageHtml);
      console.log(`  📄 Última página: ${currentPageHeight}px`);
    }
    
    document.body.removeChild(tempContainer);
    document.head.removeChild(styleSheet);
    console.log(`\n✅ ${pages.length} páginas creadas - páginas llenas al máximo sin espacios grandes`);
    
    return pages.length > 0 ? pages : [''];
  }, [leftMargin, rightMargin, MAX_CONTENT_HEIGHT, PAGE_WIDTH, measureHeight, divideElement]);


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
        console.log(`📊 HTML original: ${data.result_html.length} caracteres`);
        console.log(`📊 HTML limpiado: ${cleanedHtml.length} caracteres`);
        console.log(`📊 Proyecto: ${data.project_title || 'Documento'}`);
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
              // ref={(el) => registerPageRef(index, el)}  // TEMPORALMENTE DESACTIVADO
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
