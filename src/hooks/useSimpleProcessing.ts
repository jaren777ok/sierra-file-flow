
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AreaFiles } from '@/hooks/useMultiStepUpload';

export interface ProcessingStatus {
  status: 'idle' | 'sending' | 'processing' | 'completed' | 'error' | 'timeout';
  progress: number;
  timeElapsed: number;
  message?: string;
  resultUrl?: string;
  requestId?: string;
  sendTimestamp?: number;
  showConfetti?: boolean;
}

interface ActiveJobInfo {
  projectName: string;
  sendTimestamp: number;
  requestId: string;
}

const STORAGE_KEY = 'simple_processing_job';

export const useSimpleProcessing = () => {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0,
    timeElapsed: 0,
    showConfetti: false
  });

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();

  // Cleanup timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  // Start elapsed time tracking
  const startTimer = useCallback(() => {
    clearTimer();
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setProcessingStatus(prev => ({ ...prev, timeElapsed: elapsed }));
      }
    }, 1000);
  }, [clearTimer]);

  // Save job info to localStorage
  const saveJobInfo = useCallback((projectName: string, requestId: string) => {
    const jobInfo: ActiveJobInfo = {
      projectName,
      sendTimestamp: Date.now(),
      requestId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobInfo));
  }, []);

  // Check if there's an active job
  const hasActiveJob = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    try {
      const jobInfo: ActiveJobInfo = JSON.parse(stored);
      const elapsed = Date.now() - jobInfo.sendTimestamp;
      
      // Auto-cleanup jobs older than 15 minutes
      if (elapsed > 15 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      
      return true;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  }, []);

  // Get active job info
  const getActiveJobInfo = useCallback((): ActiveJobInfo | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  // Force cleanup
  const forceCleanup = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearTimer();
    setProcessingStatus({
      status: 'idle',
      progress: 0,
      timeElapsed: 0,
      showConfetti: false
    });
    
    toast({
      title: "🧹 Limpieza Forzada",
      description: "Se ha limpiado el trabajo activo. Puedes iniciar uno nuevo.",
    });
  }, [clearTimer, toast]);

  // Hide confetti
  const hideConfetti = useCallback(() => {
    setProcessingStatus(prev => ({ ...prev, showConfetti: false }));
  }, []);

  // Reset all state
  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearTimer();
    setProcessingStatus({
      status: 'idle',
      progress: 0,
      timeElapsed: 0,
      showConfetti: false
    });
  }, [clearTimer]);

  // Main processing function
  const processFiles = useCallback(async (
    projectName: string,
    areaFiles: AreaFiles,
    areas: Array<{ key: keyof AreaFiles; name: string; icon: string }>
  ): Promise<boolean> => {
    try {
      // Check if there's already an active job
      if (hasActiveJob()) {
        toast({
          title: "⚠️ Trabajo en Progreso",
          description: "Ya tienes un trabajo activo. Espera a que termine.",
          variant: "destructive",
        });
        return false;
      }

      // Generate request ID
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Save job info immediately
      saveJobInfo(projectName, requestId);

      // Set sending status
      setProcessingStatus({
        status: 'sending',
        progress: 5,
        timeElapsed: 0,
        message: 'Preparando archivos para envío...',
        requestId,
        sendTimestamp: Date.now(),
        showConfetti: false
      });

      startTimer();

      // Simulate file preparation and sending (1-2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Set processing status
      setProcessingStatus(prev => ({
        ...prev,
        status: 'processing',
        progress: 15,
        message: 'Archivos enviados. IA procesando...'
      }));

      // Simulate gradual progress during processing (fake webhook simulation)
      const progressInterval = setInterval(() => {
        setProcessingStatus(prev => {
          if (prev.progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return {
            ...prev,
            progress: Math.min(prev.progress + Math.random() * 10, 90)
          };
        });
      }, 2000);

      // Simulate successful completion after 8-12 seconds
      const completionTime = 8000 + Math.random() * 4000;
      
      setTimeout(() => {
        clearInterval(progressInterval);
        
        // Simulate success
        const resultUrl = `https://drive.google.com/file/d/mock_file_id_${Date.now()}/view`;
        
        setProcessingStatus(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          message: '¡Informe IA completado exitosamente!',
          resultUrl,
          showConfetti: true // Activar confeti
        }));

        // Clean up job from localStorage on success
        localStorage.removeItem(STORAGE_KEY);
        clearTimer();

        toast({
          title: "🎉 ¡Procesamiento Completado!",
          description: "Tu informe IA está listo para descargar.",
        });
      }, completionTime);

      return true;

    } catch (error) {
      console.error('Error in processFiles:', error);
      
      setProcessingStatus(prev => ({
        ...prev,
        status: 'error',
        message: 'Error durante el procesamiento'
      }));

      // Clean up on error
      localStorage.removeItem(STORAGE_KEY);
      clearTimer();

      toast({
        title: "❌ Error de Procesamiento",
        description: "Hubo un problema procesando los archivos.",
        variant: "destructive",
      });

      return false;
    }
  }, [hasActiveJob, saveJobInfo, startTimer, clearTimer, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    processingStatus,
    processFiles,
    hasActiveJob,
    getActiveJobInfo,
    forceCleanup,
    resetAll,
    hideConfetti
  };
};
