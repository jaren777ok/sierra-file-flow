
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SavedFile {
  id: string;
  project_title: string;
  area: string;
  drive_url: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
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
        .from('processed_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setFiles(data || []);
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

  const saveProcessedFile = async (projectTitle: string, area: string, driveUrl: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('processed_files')
        .insert({
          user_id: user.id,
          project_title: projectTitle,
          area: area,
          drive_url: driveUrl,
          status: 'completed',
          notes: ''
        });

      if (error) {
        throw error;
      }

      // Refresh the files list
      await fetchSavedFiles();
      
      toast({
        title: "¡Archivo Guardado!",
        description: "El archivo procesado se ha guardado correctamente.",
      });
    } catch (error) {
      console.error('Error saving processed file:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el archivo procesado",
        variant: "destructive",
      });
    }
  };

  const updateFileNotes = async (fileId: string, notes: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('processed_files')
        .update({ notes })
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId ? { ...file, notes } : file
        )
      );

      toast({
        title: "Nota Actualizada",
        description: "La nota se ha guardado correctamente.",
      });
    } catch (error) {
      console.error('Error updating file notes:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la nota",
        variant: "destructive",
      });
    }
  };

  const downloadFile = (driveUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = driveUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Descarga Iniciada",
      description: "El archivo se está descargando...",
    });
  };

  useEffect(() => {
    if (user) {
      fetchSavedFiles();
    }
  }, [user]);

  return {
    files,
    loading,
    fetchSavedFiles,
    saveProcessedFile,
    updateFileNotes,
    downloadFile
  };
};
