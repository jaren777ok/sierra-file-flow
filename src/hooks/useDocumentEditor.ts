import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
// import { HtmlToDocumentService } from '@/services/htmlToDocumentService'; // DEPRECATED - usando Markdown ahora

interface ProcessingJob {
  id: string;
  project_title: string;
  result_html: string | null;
  status: string;
  created_at: string;
}

export const useDocumentEditor = (jobId: string, isPresentation: boolean = false) => {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('processing_jobs')
          .select('*')
          .eq('id', jobId)
          .eq('status', 'completed')
          .single();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Error",
            description: "No se encontró el documento",
            variant: "destructive",
          });
          return;
        }

        setJob(data as any);

        // Parse and paginate HTML (DEPRECATED - using Markdown in SimpleWordEditor now)
        if ((data as any).result_html) {
          const rawContent = (data as any).result_html;
          
          console.log('🔄 Processing content (fallback mode - Markdown expected)');
          
          // Fallback: just use raw content without processing
          setPages([rawContent]);
        } else {
          setPages(['<p>No hay contenido disponible.</p>']);
        }
      } catch (error) {
        console.error('Error fetching job:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el documento",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId, isPresentation, toast]);

  return {
    job,
    pages,
    loading,
  };
};
