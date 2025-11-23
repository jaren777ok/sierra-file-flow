import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSimpleAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
}

export const useSimpleAutoSave = (jobId: string, content: string): UseSimpleAutoSaveReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastContentRef = useRef(content);

  const saveContent = useCallback(async () => {
    if (!jobId || !content) return;
    
    // Don't save if content hasn't changed
    if (content === lastContentRef.current) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('processing_jobs')
        .update({ 
          result_html: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      setLastSaved(new Date());
      lastContentRef.current = content;
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
    }
  }, [jobId, content]);

  // Auto-save every 30 seconds after content changes
  useEffect(() => {
    if (!content) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for 30 seconds
    timeoutRef.current = setTimeout(() => {
      saveContent();
    }, 30000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, saveContent]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await saveContent();
  }, [saveContent]);

  return {
    isSaving,
    lastSaved,
    saveNow
  };
};
