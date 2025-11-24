import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSimpleAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
}

export const useSimpleAutoSave = (jobId: string, getContent: () => string): UseSimpleAutoSaveReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastContentRef = useRef('');

  // Manual save function only - no auto-save
  const saveNow = useCallback(async () => {
    if (!jobId) return;
    
    const content = getContent();
    if (!content) return;
    
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
  }, [jobId, getContent]);

  return {
    isSaving,
    lastSaved,
    saveNow
  };
};
