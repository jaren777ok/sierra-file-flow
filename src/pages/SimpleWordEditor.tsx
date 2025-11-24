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
  const CHARS_PER_PAGE = 3500; // ~35-40 líneas de texto por página

  // Divide content into pages based on character count
  const divideContentIntoPages = useCallback((html: string): string[] => {
    if (!html) return [''];
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const pages: string[] = [];
    let currentPageHtml = '';
    let currentCharCount = 0;
    
    // Iterar sobre cada elemento hijo
    Array.from(tempDiv.children).forEach((element) => {
      const elementHtml = element.outerHTML;
      const elementTextLength = element.textContent?.length || 0;
      
      // Si un solo elemento es muy grande (más de CHARS_PER_PAGE)
      if (elementTextLength > CHARS_PER_PAGE) {
        // Caso especial: Lista muy larga - dividir por items
        if (element.tagName === 'UL' || element.tagName === 'OL') {
          const items = Array.from(element.children);
          let listHtml = `<${element.tagName.toLowerCase()}>`;
          let listCharCount = 0;
          
          items.forEach((item) => {
            const itemLength = item.textContent?.length || 0;
            
            if (listCharCount + itemLength > CHARS_PER_PAGE && listHtml !== `<${element.tagName.toLowerCase()}>`) {
              // Cerrar lista actual y crear nueva página
              listHtml += `</${element.tagName.toLowerCase()}>`;
              if (currentPageHtml) {
                pages.push(currentPageHtml + listHtml);
              } else {
                pages.push(listHtml);
              }
              currentPageHtml = '';
              currentCharCount = 0;
              listHtml = `<${element.tagName.toLowerCase()}>`;
              listCharCount = 0;
            }
            
            listHtml += item.outerHTML;
            listCharCount += itemLength;
          });
          
          // Agregar resto de la lista
          listHtml += `</${element.tagName.toLowerCase()}>`;
          currentPageHtml += listHtml;
          currentCharCount = listCharCount;
        }
        // Caso especial: Párrafo muy largo - dividir por oraciones
        else if (element.tagName === 'P') {
          const text = element.textContent || '';
          const sentences = text.split(/(?<=[.!?])\s+/);
          let paragraphText = '';
          
          sentences.forEach((sentence) => {
            if ((paragraphText.length + sentence.length) > CHARS_PER_PAGE && paragraphText) {
              const pTag = `<p>${paragraphText.trim()}</p>`;
              if (currentPageHtml) {
                pages.push(currentPageHtml + pTag);
              } else {
                pages.push(pTag);
              }
              currentPageHtml = '';
              currentCharCount = 0;
              paragraphText = sentence;
            } else {
              paragraphText += (paragraphText ? ' ' : '') + sentence;
            }
          });
          
          if (paragraphText) {
            currentPageHtml += `<p>${paragraphText.trim()}</p>`;
            currentCharCount = paragraphText.length;
          }
        }
        // Otros elementos grandes: mantener completos pero en página nueva
        else {
          if (currentPageHtml) {
            pages.push(currentPageHtml);
            currentPageHtml = '';
            currentCharCount = 0;
          }
          currentPageHtml = elementHtml;
          currentCharCount = elementTextLength;
        }
      }
      // Si agregar este elemento excede el límite
      else if (currentCharCount + elementTextLength > CHARS_PER_PAGE && currentPageHtml) {
        // Guardar página actual
        pages.push(currentPageHtml);
        // Iniciar nueva página con el elemento actual
        currentPageHtml = elementHtml;
        currentCharCount = elementTextLength;
      } else {
        // Agregar elemento a la página actual
        currentPageHtml += elementHtml;
        currentCharCount += elementTextLength;
      }
    });
    
    // Agregar última página si tiene contenido
    if (currentPageHtml) {
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

  // Divide content into pages when content or margins change
  useEffect(() => {
    if (content) {
      const dividedPages = divideContentIntoPages(content);
      setPages(dividedPages);
    }
  }, [content, divideContentIntoPages]);

  // Auto-save hook
  const { isSaving, lastSaved, saveNow } = useSimpleAutoSave(jobId || '', content);

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
    const updatedPages = [...pages];
    updatedPages[pageIndex] = newContent;
    setPages(updatedPages);
    
    // Update full content for auto-save
    setContent(updatedPages.join('\n'));
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
              paddingRight: `${rightMargin}px`,
              overflow: 'hidden'
            }}
          >
            <div
              contentEditable
              suppressContentEditableWarning
              className="outline-none h-full
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
