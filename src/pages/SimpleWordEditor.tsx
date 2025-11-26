import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSimpleAutoSave } from '@/hooks/useSimpleAutoSave';
import { SimplePdfService } from '@/services/simplePdfService';
import { SimpleToolbar } from '@/components/editors/SimpleToolbar';
import { SimpleRuler } from '@/components/editors/SimpleRuler';
import { marked } from 'marked';

const PAGE_WIDTH = 793; // A4 width in pixels (21cm at 96 DPI)
const PAGE_HEIGHT = 1123; // A4 height in pixels (29.7cm at 96 DPI)
const TOP_MARGIN = 96; // 2.54cm
const BOTTOM_MARGIN = 120; // Extra margin for footer

export default function SimpleWordEditor() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  const [htmlContent, setHtmlContent] = useState<string>(''); // HTML converted from Markdown
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [leftMargin, setLeftMargin] = useState(96); // 2.54cm default
  const [rightMargin, setRightMargin] = useState(96);
  const [pageCount, setPageCount] = useState(1);

  // Configure marked options
  useEffect(() => {
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Line breaks
    });
  }, []);

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
          // Convert Markdown to HTML
          const html = await marked(data.result_html);
          setHtmlContent(html);
          setProjectTitle(data.project_title || 'Documento Sin Título');
          console.log('✅ HTML convertido desde Markdown:', html.length, 'caracteres');
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

  // Function to adjust page breaks based on actual DOM element positions
  const adjustPageBreaks = () => {
    if (!contentRef.current) return;

    console.log('📐 Ajustando saltos de página...');

    const container = contentRef.current;
    const elements = Array.from(container.children) as HTMLElement[];
    
    let currentPageTop = 0;
    let pagesCount = 1;

    elements.forEach((element, index) => {
      // Get element's actual position and height
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const elementTop = rect.top - containerRect.top + container.scrollTop;
      const elementHeight = element.offsetHeight;
      const elementBottom = elementTop + elementHeight;

      // Calculate which page this element starts on
      const pageNumber = Math.floor(elementTop / PAGE_HEIGHT) + 1;
      const pageStartPosition = (pageNumber - 1) * PAGE_HEIGHT + TOP_MARGIN;
      const pageEndPosition = pageNumber * PAGE_HEIGHT - BOTTOM_MARGIN;

      // Check if element crosses page boundary
      if (elementBottom > pageEndPosition) {
        // Element is cut by page break
        const distanceFromPageStart = elementTop - pageStartPosition;
        
        // If element started on this page but doesn't fit, push it to next page
        if (distanceFromPageStart >= 0 && distanceFromPageStart < (PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN)) {
          const pushDistance = pageEndPosition - elementTop + TOP_MARGIN;
          element.style.marginTop = `${pushDistance}px`;
          console.log(`  ↓ Elemento ${index} empujado ${pushDistance}px a siguiente página`);
          pagesCount++;
        }
      } else {
        // Element fits completely, reset any previous margin
        if (element.style.marginTop && element.style.marginTop !== '0px') {
          element.style.marginTop = '0px';
        }
      }

      // Track maximum page count
      const elementPageEnd = Math.ceil(elementBottom / PAGE_HEIGHT);
      if (elementPageEnd > pagesCount) {
        pagesCount = elementPageEnd;
      }
    });

    setPageCount(pagesCount);
    console.log(`✅ Total de páginas: ${pagesCount}`);
  };

  // Adjust page breaks after content loads and renders
  useEffect(() => {
    if (htmlContent && contentRef.current) {
      // Wait for DOM to settle, then adjust
      const timer = setTimeout(() => {
        adjustPageBreaks();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [htmlContent]);

  // Re-adjust when margins change
  useEffect(() => {
    if (htmlContent && contentRef.current) {
      const timer = setTimeout(() => {
        adjustPageBreaks();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [leftMargin, rightMargin]);

  // Get current content from contentEditable div
  const getCurrentContent = () => {
    if (contentRef.current) {
      return contentRef.current.innerHTML;
    }
    return '';
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

      {/* Main content area with visual page separators */}
      <div className="py-8 overflow-auto">
        <div className="mx-auto" style={{ width: `${PAGE_WIDTH}px` }}>
          <div className="relative">
            {/* Visual page separator lines */}
            {Array.from({ length: pageCount }).map((_, i) => (
              i > 0 && (
                <div
                  key={i}
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ 
                    top: `${i * PAGE_HEIGHT}px`,
                    height: '8px',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 100%)',
                  }}
                />
              )
            ))}

            {/* Single editable content container with HTML rendering */}
            <div
              id="pdf-content"
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              className="bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-sierra-teal/20 transition-all"
              style={{
                width: `${PAGE_WIDTH}px`,
                minHeight: `${pageCount * PAGE_HEIGHT}px`,
                paddingTop: `${TOP_MARGIN}px`,
                paddingBottom: `${BOTTOM_MARGIN}px`,
                paddingLeft: `${leftMargin}px`,
                paddingRight: `${rightMargin}px`,
                fontFamily: 'Arial, sans-serif',
                fontSize: '11pt',
                lineHeight: '1.6',
                color: '#333',
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              onInput={() => {
                // Re-adjust page breaks when user edits
                const timer = setTimeout(() => {
                  adjustPageBreaks();
                }, 500);
                return () => clearTimeout(timer);
              }}
            />
          </div>
        </div>
      </div>

      {/* Global styles for HTML elements */}
      <style>{`
        #pdf-content h1 {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 12pt;
          color: #205059;
          margin-top: 16pt;
        }
        
        #pdf-content h2 {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 10pt;
          color: #2A656F;
          margin-top: 14pt;
        }
        
        #pdf-content h3 {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 8pt;
          color: #2A656F;
          margin-top: 12pt;
        }
        
        #pdf-content p {
          margin-bottom: 8pt;
          text-align: justify;
        }
        
        #pdf-content ul, #pdf-content ol {
          margin-left: 20pt;
          margin-bottom: 8pt;
        }
        
        #pdf-content li {
          margin-bottom: 4pt;
        }
        
        #pdf-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12pt;
          border: 1px solid #ddd;
        }
        
        #pdf-content thead {
          background-color: #f5f5f5;
        }
        
        #pdf-content th {
          border: 1px solid #ddd;
          padding: 8pt;
          text-align: left;
          font-weight: bold;
        }
        
        #pdf-content td {
          border: 1px solid #ddd;
          padding: 8pt;
        }
        
        #pdf-content strong {
          font-weight: bold;
          color: #205059;
        }
        
        #pdf-content em {
          font-style: italic;
        }
        
        #pdf-content hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 16pt 0;
        }

        #pdf-content blockquote {
          border-left: 3px solid #2A656F;
          padding-left: 12pt;
          margin-left: 0;
          margin-bottom: 8pt;
          color: #666;
        }

        #pdf-content code {
          background-color: #f5f5f5;
          padding: 2pt 4pt;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 10pt;
        }

        #pdf-content pre {
          background-color: #f5f5f5;
          padding: 12pt;
          border-radius: 4px;
          overflow-x: auto;
          margin-bottom: 12pt;
        }

        #pdf-content pre code {
          background-color: transparent;
          padding: 0;
        }
      `}</style>
    </div>
  );
}