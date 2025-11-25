import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSimpleAutoSave } from '@/hooks/useSimpleAutoSave';
import { SimplePdfService } from '@/services/simplePdfService';
import { SimpleToolbar } from '@/components/editors/SimpleToolbar';
import { SimpleRuler } from '@/components/editors/SimpleRuler';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PAGE_WIDTH = 793; // A4 width in pixels (21cm at 96 DPI)
const PAGE_HEIGHT = 1123; // A4 height in pixels (29.7cm at 96 DPI)

export default function SimpleWordEditor() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  const [content, setContent] = useState<string>(''); // Markdown content
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [leftMargin, setLeftMargin] = useState(96); // 2.54cm default
  const [rightMargin, setRightMargin] = useState(96);

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
          // result_html now contains Markdown
          setContent(data.result_html);
          setProjectTitle(data.project_title || 'Documento Sin Título');
          console.log('✅ Markdown cargado:', data.result_html.length, 'caracteres');
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

      {/* Main content area with visual page guides */}
      <div className="py-8 overflow-auto">
        <div className="mx-auto" style={{ width: `${PAGE_WIDTH}px` }}>
          <div className="relative">
            {/* Visual page guide lines every 1123px */}
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t-2 border-dashed border-gray-300 pointer-events-none"
                style={{ top: `${(i + 1) * PAGE_HEIGHT}px` }}
              />
            ))}

            {/* Single editable content container with Markdown rendering */}
            <div
              id="pdf-content"
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              className="bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-sierra-teal/20 transition-all"
              style={{
                width: `${PAGE_WIDTH}px`,
                minHeight: `${PAGE_HEIGHT}px`,
                paddingTop: '96px',
                paddingBottom: '120px',
                paddingLeft: `${leftMargin}px`,
                paddingRight: `${rightMargin}px`,
                fontFamily: 'Arial, sans-serif',
                fontSize: '11pt',
                lineHeight: '1.6',
                color: '#333',
              }}
              onInput={(e) => {
                // Update content state when user edits
                setContent(e.currentTarget.innerHTML);
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1
                      {...props}
                      style={{
                        fontSize: '18pt',
                        fontWeight: 'bold',
                        marginBottom: '12pt',
                        color: '#205059',
                      }}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      {...props}
                      style={{
                        fontSize: '14pt',
                        fontWeight: 'bold',
                        marginBottom: '10pt',
                        color: '#2A656F',
                      }}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      {...props}
                      style={{
                        fontSize: '12pt',
                        fontWeight: 'bold',
                        marginBottom: '8pt',
                        color: '#2A656F',
                      }}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p
                      {...props}
                      style={{
                        marginBottom: '8pt',
                        textAlign: 'justify',
                      }}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      {...props}
                      style={{
                        marginLeft: '20pt',
                        marginBottom: '8pt',
                        listStyleType: 'disc',
                      }}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      {...props}
                      style={{
                        marginLeft: '20pt',
                        marginBottom: '8pt',
                        listStyleType: 'decimal',
                      }}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li
                      {...props}
                      style={{
                        marginBottom: '4pt',
                      }}
                    />
                  ),
                  table: ({ node, ...props }) => (
                    <table
                      {...props}
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginBottom: '12pt',
                        border: '1px solid #ddd',
                      }}
                    />
                  ),
                  thead: ({ node, ...props }) => (
                    <thead
                      {...props}
                      style={{
                        backgroundColor: '#f5f5f5',
                      }}
                    />
                  ),
                  th: ({ node, ...props }) => (
                    <th
                      {...props}
                      style={{
                        border: '1px solid #ddd',
                        padding: '8pt',
                        textAlign: 'left',
                        fontWeight: 'bold',
                      }}
                    />
                  ),
                  td: ({ node, ...props }) => (
                    <td
                      {...props}
                      style={{
                        border: '1px solid #ddd',
                        padding: '8pt',
                      }}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong
                      {...props}
                      style={{
                        fontWeight: 'bold',
                        color: '#205059',
                      }}
                    />
                  ),
                  em: ({ node, ...props }) => (
                    <em
                      {...props}
                      style={{
                        fontStyle: 'italic',
                      }}
                    />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr
                      {...props}
                      style={{
                        border: 'none',
                        borderTop: '1px solid #ddd',
                        margin: '16pt 0',
                      }}
                    />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
