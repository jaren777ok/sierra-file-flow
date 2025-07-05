
import { useEffect, useRef, useState } from 'react';
import { useProcessingPersistence } from './useProcessingPersistence';
import { useToast } from '@/hooks/use-toast';

interface UseJobPollingProps {
  requestId: string | null;
  onJobCompleted: (resultUrl: string) => void;
  onJobError: (errorMessage: string) => void;
}

export const useJobPolling = ({ requestId, onJobCompleted, onJobError }: UseJobPollingProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const [pollStartTime, setPollStartTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { checkJobCompletion } = useProcessingPersistence();
  const { toast } = useToast();

  const INITIAL_WAIT_TIME = 5 * 60 * 1000; // 5 minutos
  const POLLING_INTERVAL = 60 * 1000; // 1 minuto
  const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutos

  const startPolling = () => {
    console.log('Starting polling for request:', requestId);
    
    if (!requestId || isPolling) return;
    
    setIsPolling(true);
    setPollStartTime(Date.now());

    // Esperar 5 minutos antes de comenzar el polling
    timeoutRef.current = setTimeout(() => {
      console.log('Initial wait complete, starting periodic polling');
      
      // Comenzar polling cada minuto
      intervalRef.current = setInterval(async () => {
        console.log('Polling for job completion...');
        
        const job = await checkJobCompletion(requestId);
        if (job) {
          if (job.result_url) {
            console.log('Job completed with result URL:', job.result_url);
            stopPolling();
            onJobCompleted(job.result_url);
          } else if (job.error_message) {
            console.log('Job completed with error:', job.error_message);
            stopPolling();
            onJobError(job.error_message);
          }
        }
      }, POLLING_INTERVAL);

      // Timeout después de 15 minutos total
      setTimeout(() => {
        if (isPolling) {
          console.log('Job polling timeout reached');
          stopPolling();
          onJobError('El procesamiento tardó más de 15 minutos. Por favor, intenta nuevamente.');
        }
      }, TIMEOUT_DURATION - INITIAL_WAIT_TIME);
      
    }, INITIAL_WAIT_TIME);
  };

  const stopPolling = () => {
    console.log('Stopping polling');
    setIsPolling(false);
    setPollStartTime(null);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    isPolling,
    startPolling,
    stopPolling,
    pollStartTime
  };
};
