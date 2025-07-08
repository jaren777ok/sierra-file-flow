
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProcessingJob {
  id: string;
  project_title: string;
  total_files: number;
  status: 'completed' | 'error' | 'timeout';
  progress: number;
  started_at: string;
  completed_at?: string;
  result_url?: string;
  error_message?: string;
  request_id: string;
  user_id: string;
}

export const useProcessingPersistence = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Función simple para guardar resultado final
  const saveCompletedJob = async (
    requestId: string,
    projectTitle: string, 
    totalFiles: number,
    userId: string,
    resultUrl?: string,
    errorMessage?: string
  ): Promise<void> => {
    try {
      const status = errorMessage ? 'error' : resultUrl ? 'completed' : 'timeout';
      
      const { error } = await supabase
        .from('processing_jobs')
        .insert({
          request_id: requestId,
          project_title: projectTitle,
          total_files: totalFiles,
          user_id: userId,
          status,
          progress: status === 'completed' ? 100 : 0,
          result_url: resultUrl,
          error_message: errorMessage,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error guardando trabajo completado:', error);
      } else {
        console.log('Trabajo guardado exitosamente:', { requestId, status });
      }
    } catch (error) {
      console.error('Error en saveCompletedJob:', error);
    }
  };

  // Función para obtener historial de trabajos del usuario
  const getUserJobHistory = async (userId: string): Promise<ProcessingJob[]> => {
    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error obteniendo historial:', error);
        return [];
      }

      return data as ProcessingJob[];
    } catch (error) {
      console.error('Error en getUserJobHistory:', error);
      return [];
    }
  };

  return {
    isLoading,
    saveCompletedJob,
    getUserJobHistory
  };
};
