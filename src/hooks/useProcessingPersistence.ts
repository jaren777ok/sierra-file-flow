
import { useState, useEffect, useCallback, useRef } from 'react';
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
  request_id: string;
  webhook_confirmed_at?: string;
}

export const useProcessingPersistence = () => {
  const [activeJob, setActiveJob] = useState<ProcessingJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Cache para evitar consultas duplicadas
  const cacheRef = useRef<{
    lastCheck: number;
    cachedJob: ProcessingJob | null;
  }>({ lastCheck: 0, cachedJob: null });
  
  const CACHE_DURATION = 30000; // 30 segundos de cache

  // Verificar si hay un trabajo activo al cargar - OPTIMIZADO con cache
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const checkActiveJob = async () => {
      try {
        // Verificar cache primero
        const now = Date.now();
        if (now - cacheRef.current.lastCheck < CACHE_DURATION) {
          console.log('Using cached active job data');
          if (isMounted) {
            setActiveJob(cacheRef.current.cachedJob);
            setIsLoading(false);
          }
          return;
        }

        console.log('Checking for active processing job...');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) {
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
          if (isMounted) setIsLoading(false);
          return;
        }

        // Actualizar cache
        cacheRef.current = {
          lastCheck: now,
          cachedJob: data && data.length > 0 ? data[0] as ProcessingJob : null
        };

        if (data && data.length > 0 && isMounted) {
          const jobData = data[0] as ProcessingJob;
          setActiveJob(jobData);
          
          // Calcular tiempo transcurrido
          const startTime = new Date(jobData.started_at).getTime();
          const currentTime = Date.now();
          const elapsedMinutes = Math.floor((currentTime - startTime) / 60000);
          
          // Solo mostrar toast si es una recuperación real (no cache)
          if (now - cacheRef.current.lastCheck >= CACHE_DURATION) {
            toast({
              title: "Trabajo en progreso recuperado",
              description: `Continuando procesamiento de "${jobData.project_title}" (${elapsedMinutes} min transcurridos)`,
            });
          }
        }
      } catch (error) {
        console.error('Error in checkActiveJob:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Verificar inmediatamente
    checkActiveJob();

    // Limpiar timeout si el componente se desmonta
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // Solo ejecutar una vez al montar

  const createJob = async (projectTitle: string, totalFiles: number): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Generar request_id único
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await supabase
        .from('processing_jobs')
        .insert({
          user_id: user.id,
          project_title: projectTitle,
          total_files: totalFiles,
          status: 'processing',
          progress: 0,
          request_id: requestId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating job:', error);
        return null;
      }

      const jobData = data as ProcessingJob;
      setActiveJob(jobData);
      
      // Limpiar cache para forzar actualización
      cacheRef.current = { lastCheck: 0, cachedJob: jobData };
      
      return jobData.request_id;
    } catch (error) {
      console.error('Error in createJob:', error);
      return null;
    }
  };

  const confirmWebhookReceived = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('processing_jobs')
        .update({ 
          webhook_confirmed_at: new Date().toISOString(),
          progress: 10,
          updated_at: new Date().toISOString() 
        })
        .eq('request_id', requestId);

      if (error) {
        console.error('Error confirming webhook:', error);
        return;
      }

      setActiveJob(prev => prev ? { 
        ...prev, 
        webhook_confirmed_at: new Date().toISOString(),
        progress: 10 
      } : null);
      
      // Limpiar cache
      cacheRef.current.lastCheck = 0;
    } catch (error) {
      console.error('Error in confirmWebhookReceived:', error);
    }
  };

  const updateJobProgress = async (requestId: string, progress: number) => {
    try {
      const { error } = await supabase
        .from('processing_jobs')
        .update({ progress, updated_at: new Date().toISOString() })
        .eq('request_id', requestId);

      if (error) {
        console.error('Error updating job progress:', error);
        return;
      }

      setActiveJob(prev => prev ? { ...prev, progress } : null);
      
      // Limpiar cache
      cacheRef.current.lastCheck = 0;
    } catch (error) {
      console.error('Error in updateJobProgress:', error);
    }
  };

  const checkJobCompletion = async (requestId: string): Promise<ProcessingJob | null> => {
    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (error) {
        console.error('Error checking job completion:', error);
        return null;
      }

      return data as ProcessingJob;
    } catch (error) {
      console.error('Error in checkJobCompletion:', error);
      return null;
    }
  };

  const completeJob = async (requestId: string, resultUrl?: string, errorMessage?: string) => {
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
        .eq('request_id', requestId);

      if (error) {
        console.error('Error completing job:', error);
        return;
      }

      setActiveJob(prev => prev ? {
        ...prev,
        status: status as 'completed' | 'error',
        progress: errorMessage ? prev.progress : 100,
        completed_at: new Date().toISOString(),
        result_url: resultUrl,
        error_message: errorMessage
      } : null);
      
      // Limpiar cache
      cacheRef.current = { lastCheck: 0, cachedJob: null };
    } catch (error) {
      console.error('Error in completeJob:', error);
    }
  };

  const clearActiveJob = useCallback(() => {
    setActiveJob(null);
    // Limpiar cache
    cacheRef.current = { lastCheck: 0, cachedJob: null };
  }, []);

  return {
    activeJob,
    isLoading,
    createJob,
    confirmWebhookReceived,
    updateJobProgress,
    checkJobCompletion,
    completeJob,
    clearActiveJob
  };
};
