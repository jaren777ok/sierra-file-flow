
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SavedFile {
  id: string;
  project_title: string;
  total_files: number;
  status: string;
  progress: number;
  result_html: string | null;
  result_url: string | null;
  created_at: string;
}

export const useSavedFiles = () => {
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSavedFiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setFiles(data as any || []);
    } catch (error) {
      console.error('Error fetching saved files:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los archivos guardados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Removed saveProcessedFile, updateFileNotes, downloadFile functions
  // as they're no longer needed with processing_jobs

  useEffect(() => {
    if (user) {
      fetchSavedFiles();
    }
  }, [user]);

  return {
    files,
    loading,
    fetchSavedFiles,
  };
};
