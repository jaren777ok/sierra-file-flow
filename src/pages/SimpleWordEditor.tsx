import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SimpleToolbar } from '@/components/editors/SimpleToolbar';
import { useSimpleAutoSave } from '@/hooks/useSimpleAutoSave';
import { SimplePdfService } from '@/services/simplePdfService';

const SimpleWordEditor = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [projectTitle, setProjectTitle] = useState('Documento');
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

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
          setContent(data.result_html || '');
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

  // Auto-save hook
  const { isSaving, lastSaved, saveNow } = useSimpleAutoSave(jobId || '', content);

  // Format text
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    // Update content after format
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    try {
      await SimplePdfService.generatePdf('word-container', `${projectTitle}.pdf`);
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

  // Handle content changes
  const handleContentChange = () => {
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
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

      <div className="flex justify-center p-8">
        <div
          id="word-container"
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          className="bg-white w-[800px] min-h-[1100px] p-[60px] shadow-lg rounded-sm 
                     focus:outline-none focus:ring-2 focus:ring-sierra-teal/20
                     [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-foreground
                     [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:text-foreground
                     [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-foreground
                     [&_p]:mb-3 [&_p]:text-foreground [&_p]:leading-relaxed
                     [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-3
                     [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-3
                     [&_li]:mb-1 [&_li]:text-foreground
                     [&_table]:border-collapse [&_table]:w-full [&_table]:mb-4
                     [&_td]:border [&_td]:border-border [&_td]:p-2
                     [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted
                     text-base font-['Arial']"
          dangerouslySetInnerHTML={{ __html: content }}
          onInput={handleContentChange}
          onBlur={handleContentChange}
        />
      </div>
    </div>
  );
};

export default SimpleWordEditor;
