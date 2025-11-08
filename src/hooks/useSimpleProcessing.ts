
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { useProcessingTimer } from '@/hooks/useProcessingTimer';
import { supabase } from '@/integrations/supabase/client';
import { ProcessingService } from '@/services/processingService';
import { ProcessingStatus } from '@/types/processing';
import { generateRequestId, calculateTotalFiles } from '@/utils/processingUtils';
import { PROCESSING_CONSTANTS } from '@/constants/processing';

const useSimpleProcessing = () => {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0,
    message: '',
    timeElapsed: 0,
    showConfetti: false
  });
  
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { saveProcessedFile } = useSavedFiles();
  const { timeElapsed, startTimer, stopTimer, resetTimer } = useProcessingTimer();

  // Update processing status with current time
  useEffect(() => {
    setProcessingStatus(prev => ({
      ...prev,
      timeElapsed,
      progress: prev.status === 'processing' ? Math.min(Math.floor((timeElapsed / 900) * 100), 95) : prev.progress
    }));
  }, [timeElapsed]);

  const startProcessing = useCallback(async (projectTitle: string, files: File[], projectFiles?: any, companyAnalysis?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const requestId = generateRequestId();

      console.log(`🚀 [${requestId}] Iniciando procesamiento simplificado:`, { 
        projectTitle, 
        fileCount: files.length,
        pollingInterval: '1 minuto',
        maxWaitTime: '15 minutos'
      });
      
      setProcessingStatus({
        status: 'sending',
        progress: PROCESSING_CONSTANTS.PROGRESS_STEPS.INITIAL,
        message: 'Preparando archivos para envío...',
        timeElapsed: 0,
        showConfetti: false,
        requestId
      });
      setResultUrl(null);
      
      startTimer();
      
      // Update to processing status
      setProcessingStatus(prev => ({
        ...prev,
        status: 'processing',
        progress: PROCESSING_CONSTANTS.PROGRESS_STEPS.SENDING,
        message: 'Enviando archivos al servidor...',
        requestId
      }));

      console.log(`📡 [${requestId}] Enviando archivos e iniciando procesamiento...`);
      
      try {
        // Send request and get requestId back immediately
        const returnedRequestId = await ProcessingService.sendProcessingRequest({
          projectTitle,
          files,
          projectFiles,
          userId: user.id,
          requestId,
          companyAnalysis
        });
        
        console.log(`✅ [${requestId}] Archivos enviados, N8n procesará en background`);
        console.log(`🔄 [${requestId}] Iniciando polling cada 1 minuto (máximo 15 minutos)`);
        
        // Update status to show we're now polling
        setProcessingStatus(prev => ({
          ...prev,
          status: 'processing',
          progress: PROCESSING_CONSTANTS.PROGRESS_STEPS.PROCESSING,
          message: 'Procesando archivos en el servidor (revisando cada minuto)...',
          requestId: returnedRequestId
        }));

        // Start polling for status (every 1 minute)
        const pollInterval = setInterval(async () => {
          try {
            const statusResult = await ProcessingService.checkStatus(returnedRequestId);
            
            console.log(`🔄 [${returnedRequestId}] Status: ${statusResult.status}, Progress: ${statusResult.progress}%`);
            
            if (statusResult.status === 'completed') {
              clearInterval(pollInterval);
              stopTimer();
              
              setProcessingStatus(prev => ({
                ...prev,
                status: 'completed',
                progress: 100,
                message: '¡Procesamiento completado exitosamente!',
                showConfetti: true,
                requestId: returnedRequestId
              }));
              
              setResultUrl(statusResult.resultUrl!);
              
              // Save processed file
              await saveProcessedFile(projectTitle, 'Multi-área', statusResult.resultUrl!);
              
              toast({
                title: "¡Procesamiento Completado!",
                description: `Tu archivo ha sido procesado correctamente. ID: ${returnedRequestId}`,
              });
              
            } else if (statusResult.status === 'error') {
              clearInterval(pollInterval);
              stopTimer();
              
              setProcessingStatus(prev => ({
                ...prev,
                status: 'error',
                progress: 0,
                message: statusResult.errorMessage || 'Error durante el procesamiento',
                showConfetti: false
              }));
              
              toast({
                title: "Error en el Procesamiento",
                description: `${statusResult.errorMessage} (ID: ${returnedRequestId})`,
                variant: "destructive",
              });
              
            } else if (statusResult.status === 'timeout') {
              clearInterval(pollInterval);
              stopTimer();
              
              setProcessingStatus(prev => ({
                ...prev,
                status: 'timeout',
                message: 'El procesamiento excedió el tiempo límite.',
                showConfetti: false
              }));
              
              toast({
                title: "Tiempo Límite Alcanzado",
                description: `El procesamiento excedió el tiempo límite. (ID: ${returnedRequestId})`,
                variant: "destructive",
              });
              
            } else {
              // Still processing - update progress
              setProcessingStatus(prev => ({
                ...prev,
                status: 'processing',
                progress: statusResult.progress || prev.progress,
                message: getProgressMessage(statusResult.progress),
              }));
            }
          } catch (pollError) {
            console.error('Error durante polling:', pollError);
          }
        }, PROCESSING_CONSTANTS.POLLING_INTERVAL);

        // Safety timeout after 15 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (processingStatus.status === 'processing') {
            stopTimer();
            setProcessingStatus(prev => ({
              ...prev,
              status: 'timeout',
              message: 'El procesamiento excedió el tiempo máximo de espera.',
              showConfetti: false
            }));
            
            toast({
              title: "Tiempo Máximo Alcanzado",
              description: "El procesamiento está tomando más tiempo del esperado.",
              variant: "destructive",
            });
          }
        }, PROCESSING_CONSTANTS.MAX_POLLING_TIME);
        
      } catch (processingError: any) {
        throw processingError;
      }
      
    } catch (error) {
      console.error(`❌ Error durante el procesamiento:`, error);
      
      stopTimer();
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido durante el procesamiento';
      const requestId = processingStatus.requestId || 'unknown';
      
      setProcessingStatus(prev => ({
        ...prev,
        status: 'error',
        progress: 0,
        message: errorMessage,
        showConfetti: false,
        requestId
      }));
      
      toast({
        title: "Error en el Procesamiento",
        description: `${errorMessage} (ID: ${requestId})`,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [startTimer, stopTimer, toast, saveProcessedFile, processingStatus.requestId]);

  const getProgressMessage = (progress: number): string => {
    if (progress < 30) return 'Procesando archivos en el servidor...';
    if (progress < 50) return 'Analizando documentos comerciales...';
    if (progress < 80) return 'Generando reporte inteligente...';
    return 'Casi listo, últimos detalles...';
  };

  const resetProcessing = useCallback(() => {
    stopTimer();
    resetTimer();
    
    setProcessingStatus({
      status: 'idle',
      progress: 0,
      message: '',
      timeElapsed: 0,
      showConfetti: false
    });
    setResultUrl(null);
  }, [stopTimer, resetTimer]);

  const hideConfetti = useCallback(() => {
    setProcessingStatus(prev => ({
      ...prev,
      showConfetti: false
    }));
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  return {
    processingStatus,
    resultUrl,
    startProcessing,
    resetProcessing,
    hideConfetti
  };
};

export default useSimpleProcessing;
