
import { useEffect, useRef, useState, useCallback } from 'react';
import { useProcessingPersistence } from './useProcessingPersistence';
import { useToast } from '@/hooks/use-toast';

interface UseJobPollingProps {
  requestId: string | null;
  onJobCompleted: (resultUrl: string) => void;
  onJobError: (errorMessage: string) => void;
  onJobTimeout: () => void;
}

export const useJobPolling = ({ 
  requestId, 
  onJobCompleted, 
  onJobError,
  onJobTimeout 
}: UseJobPollingProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  
  const { checkJobCompletion, markJobAsTimeout, activeJob } = useProcessingPersistence();
  const { toast } = useToast();

  const INITIAL_WAIT_TIME = 2 * 60 * 1000; // 2 minutos inicial
  const POLLING_INTERVAL = 60 * 1000; // 1 MINUTO
  const MAX_PROCESSING_TIME = 15 * 60 * 1000; // 15 minutos TOTAL

  const stopPolling = useCallback(() => {
    console.log('🛑 Stopping polling');
    setIsPolling(false);
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

  // Verificar timeout basado en el tiempo de inicio almacenado
  const checkTimeout = useCallback(() => {
    if (!startTimeRef.current) return false;
    
    const elapsedTime = Date.now() - startTimeRef.current;
    const hasTimedOut = elapsedTime >= MAX_PROCESSING_TIME;
    
    if (hasTimedOut) {
      console.log('⏰ Job timed out - 15 minutes elapsed from start time');
    }
    
    return hasTimedOut;
  }, []);

  const handleTimeout = useCallback(async () => {
    console.log('⏰ Handling job timeout - cleaning up');
    
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

  // Verificar si ya existe un trabajo completado antes de iniciar polling
  const checkExistingJob = useCallback(async () => {
    if (!requestId) return null;
    
    console.log('🔍 Checking for existing job before starting polling...');
    const job = await checkJobCompletion(requestId);
    
    if (job) {
      console.log('📋 Found existing job:', {
        jobId: job.id,
        status: job.status,
        hasResultUrl: !!job.result_url,
        progress: job.progress
      });
      
      // Si ya está completado o tiene error, manejar inmediatamente
      if (job.status === 'completed' && job.result_url) {
        console.log('✅ Job already completed, triggering completion callback');
        onJobCompleted(job.result_url);
        return job;
      } else if (job.status === 'error' && job.error_message) {
        console.log('❌ Job already has error, triggering error callback');
        onJobError(job.error_message);
        return job;
      }
    }
    
    return job;
  }, [requestId, checkJobCompletion, onJobCompleted, onJobError]);

  const startPolling = useCallback(async () => {
    console.log('🚀 Starting polling for request:', requestId);
    
    if (!requestId || isPollingRef.current) {
      console.log('⚠️ Polling already active or no requestId');
      return;
    }

    // Establecer tiempo de inicio si no existe
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    // Verificar timeout ANTES de empezar
    if (checkTimeout()) {
      console.log('⏰ Job already timed out, handling timeout immediately');
      handleTimeout();
      return;
    }

    // Verificar si el trabajo ya existe y está completado
    const existingJob = await checkExistingJob();
    if (existingJob && (existingJob.status === 'completed' || existingJob.status === 'error')) {
      console.log('✅ Job already finished, no need to poll');
      return;
    }
    
    setIsPolling(true);
    isPollingRef.current = true;

    // Calcular tiempo transcurrido
    const elapsedTime = Date.now() - startTimeRef.current;
    console.log(`⏱️ Elapsed time since start: ${Math.floor(elapsedTime / 1000)}s`);
    
    // Si ya pasaron más de 2 minutos, empezar polling inmediatamente
    const waitTime = Math.max(0, INITIAL_WAIT_TIME - elapsedTime);
    
    console.log(`⏳ Wait time before polling: ${Math.floor(waitTime / 1000)}s`);

    // Configurar timeout final basado en tiempo restante
    const remainingTime = Math.max(0, MAX_PROCESSING_TIME - elapsedTime);
    if (remainingTime > 0) {
      timeoutRef.current = setTimeout(() => {
        if (isPollingRef.current) {
          console.log('⏰ Final timeout reached');
          handleTimeout();
        }
      }, remainingTime);
    } else {
      // Si ya no queda tiempo, timeout inmediatamente
      handleTimeout();
      return;
    }

    // Función de polling cada minuto
    const pollFunction = async () => {
      if (!isPollingRef.current) {
        stopPolling();
        return;
      }

      // Verificar timeout en cada polling
      if (checkTimeout()) {
        handleTimeout();
        return;
      }
      
      console.log('🔄 Polling for job completion...');
      
      try {
        const job = await checkJobCompletion(requestId);
        if (job) {
          console.log('📊 Job status during polling:', {
            jobId: job.id,
            status: job.status,
            hasResultUrl: !!job.result_url,
            hasError: !!job.error_message,
            progress: job.progress
          });
          
          // Verificar si está completado
          if (job.status === 'completed' && job.result_url) {
            console.log('🎉 Job completed with result URL:', job.result_url);
            stopPolling();
            onJobCompleted(job.result_url);
          } else if (job.status === 'error' && job.error_message) {
            console.log('💥 Job failed with error:', job.error_message);
            stopPolling();
            onJobError(job.error_message);
          }
        } else {
          console.log('🔍 Job not found yet, continuing to poll...');
        }
      } catch (error) {
        console.error('💥 Error during polling:', error);
      }
    };

    // Iniciar polling después del tiempo de espera
    setTimeout(() => {
      if (!isPollingRef.current) return;
      
      console.log('🔄 Starting periodic polling every 1 minute');
      
      // Primera ejecución inmediata
      pollFunction();
      
      // Luego cada minuto
      intervalRef.current = setInterval(pollFunction, POLLING_INTERVAL);
      
    }, waitTime);
  }, [requestId, checkJobCompletion, onJobCompleted, onJobError, checkTimeout, handleTimeout, stopPolling, checkExistingJob]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Establecer tiempo de inicio cuando se detecta un trabajo activo
  useEffect(() => {
    if (activeJob && activeJob.started_at && !startTimeRef.current) {
      startTimeRef.current = new Date(activeJob.started_at).getTime();
      console.log('📅 Set start time from active job:', new Date(activeJob.started_at).toISOString());
    }
  }, [activeJob]);

  return {
    isPolling,
    startPolling,
    stopPolling
  };
};
