
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProcessingJob {
  id: string;
  project_title: string;
  total_files: number;
  status: 'processing' | 'completed' | 'error';
  progress: number;
  started_at: string;
  completed_at?: string;
  result_url?: string;
  error_message?: string;
  webhook_data?: any;
}

export const useProcessingPersistence = () => {
  const [activeJob, setActiveJob] = useState<ProcessingJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Verificar si hay un trabajo activo al cargar
  useEffect(() => {
    checkActiveJob();
  }, []);

  const checkActiveJob = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking active job:', error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setActiveJob(data[0]);
        toast({
          title: "Trabajo en progreso recuperado",
          description: `Continuando procesamiento de "${data[0].project_title}"`,
        });
      }
    } catch (error) {
      console.error('Error in checkActiveJob:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createJob = async (projectTitle: string, totalFiles: number): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('processing_jobs')
        .insert({
          user_id: user.id,
          project_title: projectTitle,
          total_files: totalFiles,
          status: 'processing',
          progress: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating job:', error);
        return null;
      }

      setActiveJob(data);
      return data.id;
    } catch (error) {
      console.error('Error in createJob:', error);
      return null;
    }
  };

  const updateJobProgress = async (jobId: string, progress: number) => {
    try {
      const { error } = await supabase
        .from('processing_jobs')
        .update({ progress, updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (error) {
        console.error('Error updating job progress:', error);
        return;
      }

      setActiveJob(prev => prev ? { ...prev, progress } : null);
    } catch (error) {
      console.error('Error in updateJobProgress:', error);
    }
  };

  const completeJob = async (jobId: string, resultUrl?: string, errorMessage?: string) => {
    try {
      const status = errorMessage ? 'error' : 'completed';
      const { error } = await supabase
        .from('processing_jobs')
        .update({
          status,
          progress: errorMessage ? activeJob?.progress || 0 : 100,
          completed_at: new Date().toISOString(),
          result_url: resultUrl,
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) {
        console.error('Error completing job:', error);
        return;
      }

      setActiveJob(prev => prev ? {
        ...prev,
        status,
        progress: errorMessage ? prev.progress : 100,
        completed_at: new Date().toISOString(),
        result_url: resultUrl,
        error_message: errorMessage
      } : null);
    } catch (error) {
      console.error('Error in completeJob:', error);
    }
  };

  const clearActiveJob = () => {
    setActiveJob(null);
  };

  return {
    activeJob,
    isLoading,
    createJob,
    updateJobProgress,
    completeJob,
    clearActiveJob,
    checkActiveJob
  };
};
