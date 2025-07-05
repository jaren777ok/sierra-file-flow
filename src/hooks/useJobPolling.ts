
import { useEffect, useRef, useState, useCallback } from 'react';
import { useProcessingPersistence } from './useProcessingPersistence';
import { useToast } from '@/hooks/use-toast';

interface UseJobPollingProps {
  requestId: string | null;
  activeJobStartTime?: string | null;
  onJobCompleted: (resultUrl: string) => void;
  onJobError: (errorMessage: string) => void;
  onJobTimeout: () => void;
}

export const useJobPolling = ({ 
  requestId, 
  activeJobStartTime,
  onJobCompleted, 
  onJobError,
  onJobTimeout 
}: UseJobPollingProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const [pollStartTime, setPollStartTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  
  const { checkJobCompletion, markJobAsTimeout, getTrackingData, isJobWithinTimeLimit } = useProcessingPersistence();
  const { toast } = useToast();

  const INITIAL_WAIT_TIME = 2 * 60 * 1000; // 2 minutos inicial
  const POLLING_INTERVAL = 30 * 1000; // 30 segundos
  const MAX_PROCESSING_TIME = 15 * 60 * 1000; // 15 minutos TOTAL

  const stopPolling = useCallback(() => {
    console.log('Stopping polling');
    setIsPolling(false);
    setPollStartTime(null);
    isPollingRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Función para verificar si ya se cumplió el timeout basado en tiempo de envío
  const checkTimeout = useCallback(() => {
    // Primero verificar datos de tracking locales
    const trackingData = getTrackingData();
    if (trackingData && trackingData.sendTimestamp) {
      return !isJobWithinTimeLimit(trackingData.sendTimestamp);
    }

    // Fallback: verificar con activeJobStartTime
    if (!activeJobStartTime) return false;
    
    const startTime = new Date(activeJobStartTime).getTime();
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    
    return elapsedTime >= MAX_PROCESSING_TIME;
  }, [activeJobStartTime, getTrackingData, isJobWithinTimeLimit]);

  const handleTimeout = useCallback(async () => {
    console.log('Job timeout reached - 15 minutes elapsed from send time');
    
    if (requestId) {
      await markJobAsTimeout(requestId);
    }
    
    stopPolling();
    onJobTimeout();
    
    toast({
      title: "Tiempo límite alcanzado",
      description: "El procesamiento tardó más de 15 minutos. Puedes iniciar un nuevo trabajo.",
      variant: "destructive",
    });
  }, [requestId, markJobAsTimeout, stopPolling, onJobTimeout, toast]);

  // MEJORADA - Verificar trabajo existente antes de iniciar polling
  const checkExistingJob = useCallback(async () => {
    if (!requestId) return null;
    
    console.log('Checking for existing job before starting polling...');
    const job = await checkJobCompletion(requestId);
    
    if (job) {
      console.log('Found existing job:', {
        jobId: job.id,
        status: job.status,
        hasResultUrl: !!job.result_url,
        progress: job.progress
      });
      
      // Si ya está completado o tiene error, manejar inmediatamente
      if (job.status === 'completed' && job.result_url) {
        console.log('Job already completed, triggering completion callback');
        onJobCompleted(job.result_url);
        return job;
      } else if (job.status === 'error' && job.error_message) {
        console.log('Job already has error, triggering error callback');
        onJobError(job.error_message);
        return job;
      }
    }
    
    return job;
  }, [requestId, checkJobCompletion, onJobCompleted, onJobError]);

  const startPolling = useCallback(async () => {
    console.log('Starting polling for request:', requestId);
    
    if (!requestId || isPollingRef.current) {
      console.log('Polling already active or no requestId');
      return;
    }

    // Verificar si ya se cumplió el timeout antes de empezar
    if (checkTimeout()) {
      console.log('Job already timed out, handling timeout immediately');
      handleTimeout();
      return;
    }

    // NUEVO - Verificar si el trabajo ya existe y está completado
    const existingJob = await checkExistingJob();
    if (existingJob && (existingJob.status === 'completed' || existingJob.status === 'error')) {
      console.log('Job already finished, no need to poll');
      return;
    }
    
    setIsPolling(true);
    setPollStartTime(Date.now());
    isPollingRef.current = true;

    // Calcular cuánto tiempo ha pasado desde el envío inicial
    const trackingData = getTrackingData();
    let elapsedTime = 0;
    
    if (trackingData && trackingData.sendTimestamp) {
      elapsedTime = Date.now() - trackingData.sendTimestamp;
    } else if (activeJobStartTime) {
      const jobStartTime = new Date(activeJobStartTime).getTime();
      elapsedTime = Date.now() - jobStartTime;
    }
    
    // Si ya pasaron más de 2 minutos, empezar polling inmediatamente
    const waitTime = Math.max(0, INITIAL_WAIT_TIME - elapsedTime);
    
    console.log(`Waiting ${waitTime}ms before starting polling (elapsed: ${elapsedTime}ms)`);

    timeoutRef.current = setTimeout(() => {
      if (!isPollingRef.current) return;
      
      console.log('Initial wait complete, starting periodic polling');
      
      // Comenzar polling cada 30 segundos
      intervalRef.current = setInterval(async () => {
        if (!isPollingRef.current) {
          stopPolling();
          return;
        }

        // Verificar timeout en cada polling basado en tiempo de envío
        if (checkTimeout()) {
          handleTimeout();
          return;
        }
        
        console.log('Polling for job completion...');
        
        try {
          const job = await checkJobCompletion(requestId);
          if (job) {
            console.log('Job status during polling:', {
              jobId: job.id,
              status: job.status,
              hasResultUrl: !!job.result_url,
              hasError: !!job.error_message,
              progress: job.progress
            });
            
            // Verificar si está completado (status completed O tiene result_url)
            if (job.status === 'completed' && job.result_url) {
              console.log('✅ Job completed with result URL:', job.result_url);
              stopPolling();
              onJobCompleted(job.result_url);
            } else if (job.status === 'error' && job.error_message) {
              console.log('❌ Job completed with error:', job.error_message);
              stopPolling();
              onJobError(job.error_message);
            } else if (job.result_url && job.status === 'processing') {
              // Caso especial: N8N subió URL pero no cambió status
              console.log('🔄 Found result_url but status still processing, job should be completed');
              stopPolling();
              onJobCompleted(job.result_url);
            }
          }
        } catch (error) {
          console.error('Error during polling:', error);
        }
      }, POLLING_INTERVAL);

      // Configurar timeout final basado en tiempo restante desde el envío
      const remainingTime = Math.max(0, MAX_PROCESSING_TIME - elapsedTime - waitTime);
      
      if (remainingTime > 0) {
        setTimeout(() => {
          if (isPollingRef.current) {
            handleTimeout();
          }
        }, remainingTime);
      } else {
        // Si ya no queda tiempo, hacer timeout inmediatamente
        handleTimeout();
      }
      
    }, waitTime);
  }, [requestId, activeJobStartTime, checkJobCompletion, onJobCompleted, onJobError, checkTimeout, handleTimeout, stopPolling, getTrackingData, checkExistingJob]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isPolling,
    startPolling,
    stopPolling,
    pollStartTime
  };
};
