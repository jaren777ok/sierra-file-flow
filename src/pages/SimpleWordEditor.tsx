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
const TOP_MARGIN = 96; // 2.54cm
const BOTTOM_MARGIN = 120; // Extra margin for footer

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

  // Simple page count calculation based on content height - no artificial pagination
  const calculatePageCount = () => {
    if (!contentRef.current) return;
    
    const totalHeight = contentRef.current.scrollHeight;
    const pagesNeeded = Math.ceil(totalHeight / PAGE_HEIGHT);
    
    setPageCount(pagesNeeded);
    console.log(`📄 Total de páginas: ${pagesNeeded} (altura: ${totalHeight}px)`);
  };

  // Calculate page count after content loads
  useEffect(() => {
    if (htmlContent && contentRef.current) {
      const timer = setTimeout(() => {
        calculatePageCount();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [htmlContent]);

  // Recalculate when margins change (narrower margins = more vertical text)
  useEffect(() => {
    if (htmlContent && contentRef.current) {
      const timer = setTimeout(() => {
        calculatePageCount();
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

      {/* Main content area with natural flow */}
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="mx-auto relative" style={{ width: `${PAGE_WIDTH}px` }}>
          {/* Visual margin zones and page separators */}
          {Array.from({ length: pageCount }).map((_, i) => (
            <div key={i}>
              {/* Top margin zone - gray gradient overlay */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: `${i * PAGE_HEIGHT}px`,
                  height: `${TOP_MARGIN}px`,
                  background: 'linear-gradient(to bottom, #f8f8f8, #fff)',
                  zIndex: 5,
                }}
              />
              
              {/* Bottom margin zone - gray gradient overlay */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: `${(i + 1) * PAGE_HEIGHT - BOTTOM_MARGIN}px`,
                  height: `${BOTTOM_MARGIN}px`,
                  background: 'linear-gradient(to top, #f8f8f8, #fff)',
                  zIndex: 5,
                }}
              />
              
              {/* Page separator between pages */}
              {i > 0 && (
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    top: `${i * PAGE_HEIGHT - 4}px`,
                    height: '8px',
                    background: '#e0e0e0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 20,
                  }}
                >
                  <span 
                    className="absolute right-2 -top-5 text-xs text-gray-500 bg-white px-2 rounded shadow-sm"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  >
                    Página {i + 1}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Content editable area - flows naturally */}
          <div
            id="pdf-content"
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            className="bg-white shadow-lg relative focus:outline-none focus:ring-2 focus:ring-sierra-teal/20 transition-all"
            style={{
              width: `${PAGE_WIDTH}px`,
              minHeight: `${pageCount * PAGE_HEIGHT}px`,
              paddingTop: `${TOP_MARGIN}px`,
              paddingBottom: `${BOTTOM_MARGIN}px`,
              paddingLeft: `${leftMargin}px`,
              paddingRight: `${rightMargin}px`,
              zIndex: 10,
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            onInput={calculatePageCount}
          />
        </div>
      </div>

      {/* Global styles for professional HTML rendering with natural flow */}
      <style>{`
        /* Base styles - allow natural content breaking */
        #pdf-content {
          font-family: Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #000;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        /* H1 - Main Document Title */
        #pdf-content h1 {
          font-size: 24pt;
          font-weight: 800;
          margin: 24pt 0 16pt 0;
          color: #000;
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 8pt;
          break-after: avoid;
          page-break-after: avoid;
        }

        /* H2 - Main Sections */
        #pdf-content h2 {
          font-size: 16pt;
          font-weight: 700;
          margin: 20pt 0 10pt 0;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
          break-after: avoid;
          page-break-after: avoid;
        }

        /* H3 - Subsections */
        #pdf-content h3 {
          font-size: 13pt;
          font-weight: 700;
          margin: 14pt 0 8pt 0;
          color: #000;
          text-transform: uppercase;
          break-after: avoid;
          page-break-after: avoid;
        }

        /* H4 - Sub-subsections */
        #pdf-content h4 {
          font-size: 12pt;
          font-weight: 600;
          margin: 12pt 0 6pt 0;
          color: #333;
          break-after: avoid;
          page-break-after: avoid;
        }

        /* Paragraphs - minimum 2 lines for natural flow */
        #pdf-content p {
          margin-bottom: 8pt;
          text-align: justify;
          orphans: 2;
          widows: 2;
        }

        /* Listas con viñetas correctas - tres niveles */
        #pdf-content ul {
          list-style-type: disc;
          padding-left: 24pt;
          margin-bottom: 8pt;
        }

        #pdf-content ul ul {
          list-style-type: circle;  /* Segundo nivel: círculos vacíos */
          margin-top: 4pt;
          margin-bottom: 4pt;
        }

        #pdf-content ul ul ul {
          list-style-type: square;  /* Tercer nivel: cuadrados */
        }

        /* Listas ordenadas */
        #pdf-content ol {
          list-style-type: decimal;
          padding-left: 24pt;
          margin-bottom: 8pt;
        }

        #pdf-content ol ol {
          list-style-type: lower-alpha;  /* Segundo nivel: a, b, c */
          margin-top: 4pt;
        }

        #pdf-content ol ol ol {
          list-style-type: lower-roman;  /* Tercer nivel: i, ii, iii */
        }

        /* Items de lista */
        #pdf-content li {
          margin-bottom: 4pt;
          line-height: 1.5;
        }

        /* Strong/Bold - negro intenso */
        #pdf-content strong {
          font-weight: 700;
          color: #000;  /* Negro puro, no color de marca */
        }

        /* Emphasis/Italic - subrayado */
        #pdf-content em {
          font-style: italic;
          text-decoration: underline;
        }

        /* Professional tables - can split across pages naturally */
        #pdf-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 12pt 0;
          font-size: 10pt;
          break-inside: auto;  /* Allow table to split between pages */
        }

        #pdf-content th {
          background-color: #f0f0f0;
          font-weight: bold;
          border: 1px solid #333;
          padding: 6pt 8pt;
          text-align: left;
        }

        #pdf-content td {
          border: 1px solid #666;
          padding: 6pt 8pt;
        }

        /* Prevent table rows from breaking */
        #pdf-content tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Horizontal rules - don't break */
        #pdf-content hr {
          border: none;
          border-top: 1px solid #333;
          margin: 12pt 0;
          break-before: avoid;
          break-after: avoid;
        }

        /* Blockquotes */
        #pdf-content blockquote {
          border-left: 3px solid #2A656F;
          padding-left: 12pt;
          margin-left: 0;
          margin-bottom: 8pt;
          color: #666;
        }

        /* Code blocks */
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