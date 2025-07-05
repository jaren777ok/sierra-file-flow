
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProcessingJob {
  id: string;
  project_title: string;
  total_files: number;
  status: 'processing' | 'completed' | 'error' | 'timeout';
  progress: number;
  started_at: string;
  completed_at?: string;
  result_url?: string;
  error_message?: string;
  webhook_data?: any;
  request_id: string;
  webhook_confirmed_at?: string;
  user_id: string;
}

interface JobTrackingData {
  requestId: string;
  sendTimestamp: number;
  projectName: string;
  userId: string;
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

  // Función para obtener datos de tracking del localStorage
  const getTrackingData = (): JobTrackingData | null => {
    try {
      const data = localStorage.getItem('current_job_tracking');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  // Función para guardar datos de tracking
  const saveTrackingData = (data: JobTrackingData) => {
    localStorage.setItem('current_job_tracking', JSON.stringify(data));
  };

  // Función para limpiar datos de tracking
  const clearTrackingData = () => {
    localStorage.removeItem('current_job_tracking');
  };

  // Función para verificar si un job está dentro del límite de tiempo (15 minutos)
  const isJobWithinTimeLimit = (sendTimestamp: number): boolean => {
    const now = Date.now();
    const elapsed = now - sendTimestamp;
    const fifteenMinutes = 15 * 60 * 1000;
    return elapsed < fifteenMinutes;
  };

  // Función para buscar trabajo por request_id (creado por N8N)
  const trackJobByRequestId = async (requestId: string): Promise<ProcessingJob | null> => {
    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 es "no rows returned"
        console.error('Error tracking job by request_id:', error);
        return null;
      }

      return data as ProcessingJob || null;
    } catch (error) {
      console.error('Error in trackJobByRequestId:', error);
      return null;
    }
  };

  // Función para buscar el último trabajo del usuario
  const findLatestUserJob = async (userId: string): Promise<ProcessingJob | null> => {
    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error finding latest user job:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] as ProcessingJob : null;
    } catch (error) {
      console.error('Error in findLatestUserJob:', error);
      return null;
    }
  };

  // Verificar si hay un trabajo activo al cargar - REFACTORIZADO
  useEffect(() => {
    let isMounted = true;
    
    const checkActiveJob = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) {
          setIsLoading(false);
          return;
        }

        // Primero verificar si hay datos de tracking locales
        const trackingData = getTrackingData();
        
        if (trackingData && trackingData.userId === user.id) {
          // Verificar si el trabajo local aún está dentro del límite de tiempo
          if (isJobWithinTimeLimit(trackingData.sendTimestamp)) {
            console.log('Checking for job created by N8N with request_id:', trackingData.requestId);
            
            // Buscar el trabajo que N8N debería haber creado
            const trackedJob = await trackJobByRequestId(trackingData.requestId);
            
            if (trackedJob) {
              console.log('Found job created by N8N:', trackedJob);
              setActiveJob(trackedJob);
              
              toast({
                title: "Trabajo en progreso recuperado",
                description: `Continuando procesamiento de "${trackedJob.project_title}"`,
              });
            } else {
              console.log('N8N job not found yet, will continue tracking...');
              // El trabajo aún no fue creado por N8N, pero está dentro del límite de tiempo
              // Mantener el tracking activo
            }
          } else {
            console.log('Local tracking data expired, cleaning up');
            clearTrackingData();
          }
        } else {
          // No hay datos locales, buscar el último trabajo del usuario
          console.log('No local tracking data, checking for latest user job...');
          const latestJob = await findLatestUserJob(user.id);
          
          if (latestJob) {
            console.log('Found latest user job:', latestJob);
            setActiveJob(latestJob);
            
            const startTime = new Date(latestJob.started_at).getTime();
            const currentTime = Date.now();
            const elapsedMinutes = Math.floor((currentTime - startTime) / 60000);
            
            toast({
              title: "Trabajo en progreso recuperado",
              description: `Continuando procesamiento de "${latestJob.project_title}" (${elapsedMinutes} min transcurridos)`,
            });
          }
        }

        // Actualizar cache
        cacheRef.current = {
          lastCheck: Date.now(),
          cachedJob: activeJob
        };

      } catch (error) {
        console.error('Error in checkActiveJob:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkActiveJob();

    return () => {
      isMounted = false;
    };
  }, []);

  // Función para iniciar el tracking de un trabajo (NO crear en BD)
  const startJobTracking = (projectTitle: string, requestId: string, userId: string): string => {
    const sendTimestamp = Date.now();
    
    const trackingData: JobTrackingData = {
      requestId,
      sendTimestamp,
      projectName: projectTitle,
      userId
    };
    
    saveTrackingData(trackingData);
    console.log('Started job tracking:', trackingData);
    
    return requestId;
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
    return await trackJobByRequestId(requestId);
  };

  const markJobAsTimeout = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('processing_jobs')
        .update({
          status: 'timeout',
          completed_at: new Date().toISOString(),
          error_message: 'El procesamiento excedió el tiempo límite de 15 minutos',
          updated_at: new Date().toISOString()
        })
        .eq('request_id', requestId);

      if (error) {
        console.error('Error marking job as timeout:', error);
        return;
      }

      setActiveJob(prev => prev ? {
        ...prev,
        status: 'timeout' as const,
        completed_at: new Date().toISOString(),
        error_message: 'El procesamiento excedió el tiempo límite de 15 minutos'
      } : null);
      
      // Limpiar datos de tracking
      clearTrackingData();
      
      // Limpiar cache
      cacheRef.current = { lastCheck: 0, cachedJob: null };
    } catch (error) {
      console.error('Error in markJobAsTimeout:', error);
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
      
      // Limpiar datos de tracking al completar
      clearTrackingData();
      
      // Limpiar cache
      cacheRef.current = { lastCheck: 0, cachedJob: null };
    } catch (error) {
      console.error('Error in completeJob:', error);
    }
  };

  const clearActiveJob = useCallback(() => {
    setActiveJob(null);
    clearTrackingData();
    // Limpiar cache
    cacheRef.current = { lastCheck: 0, cachedJob: null };
  }, []);

  return {
    activeJob,
    isLoading,
    startJobTracking, // Nueva función que reemplaza createJob
    trackJobByRequestId, // Nueva función para tracking
    findLatestUserJob, // Nueva función para recuperación
    updateJobProgress,
    checkJobCompletion,
    completeJob,
    markJobAsTimeout,
    clearActiveJob,
    getTrackingData, // Para acceso externo a datos de tracking
    isJobWithinTimeLimit // Para verificaciones externas
  };
};
