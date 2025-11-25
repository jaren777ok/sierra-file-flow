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

  // ALGORITMO DE BÚSQUEDA BINARIA: Llena páginas al 100% sin espacios
  const divideContentIntoPages = useCallback((html: string): string[] => {
    if (!html) return [''];
    
    console.log('🎯 Iniciando paginación con búsqueda binaria...');
    
    // Helper: Divide un elemento individual por palabras
    const splitFirstElement = (
      element: HTMLElement,
      referenceContainer: HTMLElement,
      maxHeight: number
    ): { pageContent: string; remainingContent: string } | null => {
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent || '';
      
      if (!text.trim()) return null;
      
      console.log(`  ✂️ Dividiendo <${tagName}> con ${text.length} caracteres`);
      
      // Búsqueda binaria por caracteres
      let low = 0;
      let high = text.length;
      let bestLength = 0;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        
        // Crear elemento de prueba
        const testElement = document.createElement(tagName);
        testElement.textContent = text.substring(0, mid);
        
        const testDiv = document.createElement('div');
        testDiv.style.width = referenceContainer.style.width;
        testDiv.style.fontFamily = referenceContainer.style.fontFamily;
        testDiv.style.fontSize = referenceContainer.style.fontSize;
        testDiv.style.lineHeight = referenceContainer.style.lineHeight;
        testDiv.style.position = 'absolute';
        testDiv.style.visibility = 'hidden';
        testDiv.appendChild(testElement);
        
        document.body.appendChild(testDiv);
        const height = testDiv.offsetHeight;
        document.body.removeChild(testDiv);
        
        if (height <= maxHeight) {
          bestLength = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      
      if (bestLength === 0) return null;
      
      // Ajustar para no cortar palabras
      let splitIndex = bestLength;
      while (splitIndex > 0 && text[splitIndex] !== ' ' && text[splitIndex] !== '\n') {
        splitIndex--;
      }
      
      if (splitIndex === 0) splitIndex = bestLength;
      
      const firstPart = text.substring(0, splitIndex).trim();
      const secondPart = text.substring(splitIndex).trim();
      
      console.log(`  ✅ Dividido: ${firstPart.length} → ${secondPart.length} chars`);
      
      return {
        pageContent: `<${tagName}>${firstPart}</${tagName}>`,
        remainingContent: secondPart
      };
    };
    
    // Helper: Encuentra punto de división usando búsqueda binaria
    const findSplitPoint = (
      container: HTMLElement,
      maxHeight: number
    ): { pageContent: string; remainingContent: string; heightUsed: number } | null => {
      const allChildren = Array.from(container.children);
      if (allChildren.length === 0) return null;
      
      // Búsqueda binaria: cuántos elementos completos caben
      let low = 0;
      let high = allChildren.length;
      let bestFit = 0;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        
        const testDiv = document.createElement('div');
        testDiv.style.width = container.style.width;
        testDiv.style.fontFamily = container.style.fontFamily;
        testDiv.style.fontSize = container.style.fontSize;
        testDiv.style.lineHeight = container.style.lineHeight;
        testDiv.style.position = 'absolute';
        testDiv.style.visibility = 'hidden';
        
        for (let i = 0; i < mid; i++) {
          testDiv.appendChild(allChildren[i].cloneNode(true));
        }
        
        document.body.appendChild(testDiv);
        const height = testDiv.offsetHeight;
        document.body.removeChild(testDiv);
        
        if (height <= maxHeight) {
          bestFit = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      
      console.log(`  🔍 ${bestFit} elementos completos caben`);
      
      // Si ningún elemento cabe, dividir el primero
      if (bestFit === 0) {
        const splitResult = splitFirstElement(allChildren[0] as HTMLElement, container, maxHeight);
        if (!splitResult) return null;
        
        return {
          pageContent: splitResult.pageContent,
          remainingContent: splitResult.remainingContent,
          heightUsed: maxHeight // Asumimos que usó todo el espacio
        };
      }
      
      // Construir página con elementos que caben
      const pageElements = allChildren.slice(0, bestFit);
      const pageContent = pageElements.map(el => el.outerHTML).join('');
      
      // Medir altura real usada
      const measureDiv = document.createElement('div');
      measureDiv.style.width = container.style.width;
      measureDiv.style.fontFamily = container.style.fontFamily;
      measureDiv.style.fontSize = container.style.fontSize;
      measureDiv.style.lineHeight = container.style.lineHeight;
      measureDiv.style.position = 'absolute';
      measureDiv.style.visibility = 'hidden';
      measureDiv.innerHTML = pageContent;
      document.body.appendChild(measureDiv);
      const heightUsed = measureDiv.offsetHeight;
      document.body.removeChild(measureDiv);
      
      const spaceLeft = maxHeight - heightUsed;
      console.log(`  📏 Espacio restante: ${spaceLeft}px`);
      
      let finalPageContent = pageContent;
      let startIndex = bestFit;
      
      // Intentar agregar parte del siguiente elemento si hay espacio
      if (spaceLeft > 50 && bestFit < allChildren.length) {
        const nextElement = allChildren[bestFit] as HTMLElement;
        const partialResult = splitFirstElement(nextElement, container, spaceLeft);
        
        if (partialResult && partialResult.pageContent.trim()) {
          finalPageContent += partialResult.pageContent;
          
          // Actualizar elemento con contenido restante
          allChildren[bestFit].innerHTML = partialResult.remainingContent || '';
          
          if (!partialResult.remainingContent.trim()) {
            startIndex = bestFit + 1;
          }
        }
      }
      
      // Contenido restante
      const remainingElements = allChildren.slice(startIndex);
      const remainingContent = remainingElements.map(el => el.outerHTML).join('');
      
      return {
        pageContent: finalPageContent,
        remainingContent,
        heightUsed
      };
    };
    
    // Crear contenedor temporal
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
    let attempts = 0;
    const MAX_ATTEMPTS = 100;
    
    while (tempContainer.innerHTML.trim() && attempts < MAX_ATTEMPTS) {
      attempts++;
      
      const currentHeight = tempContainer.offsetHeight;
      console.log(`\n📄 Página ${pages.length + 1}: altura ${currentHeight}px`);
      
      if (currentHeight <= MAX_CONTENT_HEIGHT) {
        // Todo cabe en una página
        pages.push(tempContainer.innerHTML);
        console.log(`  ✅ TODO cabe en una página`);
        break;
      }
      
      // Necesita dividir
      const splitPoint = findSplitPoint(tempContainer, MAX_CONTENT_HEIGHT);
      
      if (!splitPoint) {
        console.error('  ❌ No se pudo dividir');
        pages.push(tempContainer.innerHTML);
        break;
      }
      
      pages.push(splitPoint.pageContent);
      console.log(`  ✅ Página ${pages.length} creada (${splitPoint.heightUsed}px usados)`);
      
      tempContainer.innerHTML = splitPoint.remainingContent;
    }
    
    document.body.removeChild(tempContainer);
    console.log(`\n✅ ${pages.length} páginas creadas sin espacios vacíos`);
    
    return pages.length > 0 ? pages : [''];
  }, [leftMargin, rightMargin, MAX_CONTENT_HEIGHT, PAGE_WIDTH]);


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
