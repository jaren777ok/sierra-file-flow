import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAutoSave = (
  jobId: string,
  content: string[],
  delay: number = 5000
) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  const saveToDatabase = useCallback(async (contentToSave: string[]) => {
    try {
      setIsSaving(true);
      
      // Join all pages into single HTML
      const fullHtml = contentToSave.join('\n\n<!-- PAGE_BREAK -->\n\n');
      
      const { error } = await supabase
        .from('processing_jobs')
        .update({ 
          result_html: fullHtml,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      return true;
    } catch (error) {
      console.error('Error saving to database:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [jobId, toast]);

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges || content.length === 0) return;

    const timer = setTimeout(() => {
      saveToDatabase(content);
    }, delay);

    return () => clearTimeout(timer);
  }, [content, delay, hasUnsavedChanges, saveToDatabase]);

  const saveNow = useCallback(async () => {
    if (content.length === 0) return false;
    const success = await saveToDatabase(content);
    if (success) {
      toast({
        title: "Guardado",
        description: "Los cambios se han guardado correctamente",
      });
    }
    return success;
  }, [content, saveToDatabase, toast]);

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  return { 
    isSaving, 
    lastSaved, 
    hasUnsavedChanges,
    saveNow,
    markAsChanged
  };
};
