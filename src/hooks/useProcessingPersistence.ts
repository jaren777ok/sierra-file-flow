
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

  // Función para auto-corregir trabajos con result_url pero status incorrecto
  const autoCorrectJobStatus = async (job: ProcessingJob): Promise<ProcessingJob> => {
    // Si el trabajo tiene result_url pero status es processing, auto-corregir
    if (job.result_url && job.status === 'processing') {
      console.log('Auto-correcting job status: found result_url but status is processing', {
        jobId: job.id,
        requestId: job.request_id,
        resultUrl: job.result_url
      });
      
      try {
        const { error } = await supabase
          .from('processing_jobs')
          .update({
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (error) {
          console.error('Error auto-correcting job status:', error);
          return job;
        }

        // Retornar el trabajo con status corregido
        return {
          ...job,
          status: 'completed' as const,
          progress: 100,
          completed_at: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error in autoCorrectJobStatus:', error);
        return job;
      }
    }
    
    return job;
  };

  // Función para buscar trabajo por request_id (creado por N8N) - MEJORADA
  const trackJobByRequestId = async (requestId: string): Promise<ProcessingJob | null> => {
    try {
      console.log('Tracking job by request_id:', requestId);
      
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 es "no rows returned"
        console.error('Error tracking job by request_id:', error);
        return null;
      }

      if (!data) {
        console.log('No job found with request_id:', requestId);
        return null;
      }

      console.log('Found job by request_id:', {
        jobId: data.id,
        status: data.status,
        hasResultUrl: !!data.result_url,
        progress: data.progress
      });

      // Auto-corregir estado si es necesario
      const correctedJob = await autoCorrectJobStatus(data as ProcessingJob);
      return correctedJob;
    } catch (error) {
      console.error('Error in trackJobByRequestId:', error);
      return null;
    }
  };

  // Función para buscar el último trabajo del usuario - MEJORADA
  const findLatestUserJob = async (userId: string): Promise<ProcessingJob | null> => {
    try {
      console.log('Finding latest user job for userId:', userId);
      
      // Buscar trabajos en processing O trabajos con result_url disponible
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('user_id', userId)
        .or('status.eq.processing,and(result_url.not.is.null,status.eq.processing)')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error finding latest user job:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('No active/completed jobs found for user');
        return null;
      }

      const job = data[0] as ProcessingJob;
      console.log('Found latest user job:', {
        jobId: job.id,
        status: job.status,
        hasResultUrl: !!job.result_url,
        progress: job.progress
      });

      // Auto-corregir estado si es necesario
      const correctedJob = await autoCorrectJobStatus(job);
      return correctedJob;
    } catch (error) {
      console.error('Error in findLatestUserJob:', error);
      return null;
    }
  };

  // Verificar si hay un trabajo activo al cargar - MEJORADO
  useEffect(() => {
    let isMounted = true;
    
    const checkActiveJob = async () => {
      try {
        console.log('=== Starting active job check ===');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) {
          console.log('No user authenticated or component unmounted');
          setIsLoading(false);
          return;
        }

        console.log('Checking active job for user:', user.id);

        // Primero verificar si hay datos de tracking locales
        const trackingData = getTrackingData();
        
        if (trackingData && trackingData.userId === user.id) {
          console.log('Found local tracking data:', {
            requestId: trackingData.requestId,
            sendTimestamp: trackingData.sendTimestamp,
            withinTimeLimit: isJobWithinTimeLimit(trackingData.sendTimestamp)
          });
          
          // Verificar si el trabajo local aún está dentro del límite de tiempo
          if (isJobWithinTimeLimit(trackingData.sendTimestamp)) {
            console.log('Checking for N8N job with request_id:', trackingData.requestId);
            
            // Buscar el trabajo que N8N debería haber creado
            const trackedJob = await trackJobByRequestId(trackingData.requestId);
            
            if (trackedJob) {
              console.log('✅ Found and recovered N8N job:', {
                jobId: trackedJob.id,
                status: trackedJob.status,
                hasResultUrl: !!trackedJob.result_url,
                wasCorrected: trackedJob.result_url && trackedJob.status === 'completed'
              });
              
              setActiveJob(trackedJob);
              
              // Si el trabajo ya está completado, limpiar tracking local
              if (trackedJob.status === 'completed') {
                console.log('Job is completed, clearing local tracking');
                clearTrackingData();
              }
              
              toast({
                title: "Trabajo recuperado",
                description: trackedJob.status === 'completed' 
                  ? `Trabajo "${trackedJob.project_title}" completado exitosamente`
                  : `Continuando procesamiento de "${trackedJob.project_title}"`,
              });
            } else {
              console.log('N8N job not found yet, keeping local tracking active');
            }
          } else {
            console.log('Local tracking data expired, cleaning up');
            clearTrackingData();
          }
        } else {
          // No hay datos locales, buscar el último trabajo del usuario (incluyendo completados)
          console.log('No valid local tracking data, checking for latest user job...');
          const latestJob = await findLatestUserJob(user.id);
          
          if (latestJob) {
            console.log('✅ Found latest user job:', {
              jobId: latestJob.id,
              status: latestJob.status,
              hasResultUrl: !!latestJob.result_url
            });
            
            setActiveJob(latestJob);
            
            const startTime = new Date(latestJob.started_at).getTime();
            const currentTime = Date.now();
            const elapsedMinutes = Math.floor((currentTime - startTime) / 60000);
            
            toast({
              title: "Trabajo recuperado",
              description: latestJob.status === 'completed'
                ? `Trabajo "${latestJob.project_title}" completado exitosamente`
                : `Continuando procesamiento de "${latestJob.project_title}" (${elapsedMinutes} min transcurridos)`,
            });
          } else {
            console.log('No active or recent jobs found');
          }
        }

        // Actualizar cache
        cacheRef.current = {
          lastCheck: Date.now(),
          cachedJob: activeJob
        };

        console.log('=== Active job check completed ===');
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

  // MEJORADA - checkJobCompletion con auto-corrección
  const checkJobCompletion = async (requestId: string): Promise<ProcessingJob | null> => {
    console.log('Checking job completion for request_id:', requestId);
    const job = await trackJobByRequestId(requestId);
    
    if (job) {
      console.log('Job completion check result:', {
        jobId: job.id,
        status: job.status,
        hasResultUrl: !!job.result_url,
        progress: job.progress
      });
    }
    
    return job;
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
    startJobTracking,
    trackJobByRequestId,
    findLatestUserJob,
    updateJobProgress,
    checkJobCompletion,
    completeJob,
    markJobAsTimeout,
    clearActiveJob,
    getTrackingData,
    isJobWithinTimeLimit
  };
};
