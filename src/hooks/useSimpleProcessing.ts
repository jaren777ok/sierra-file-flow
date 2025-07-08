
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

  const startProcessing = useCallback(async (projectTitle: string, files: File[], areaFiles?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const requestId = generateRequestId();

      console.log(`🚀 [${requestId}] Iniciando procesamiento SIMPLIFICADO:`, { 
        projectTitle, 
        fileCount: files.length, 
        webhookUrl: PROCESSING_CONSTANTS.WEBHOOK_URL
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
        message: 'Enviando archivos y esperando respuesta del servidor (máximo 15 minutos)...',
        requestId
      }));

      console.log(`📡 [${requestId}] Enviando a webhook con timeout de 15 minutos...`);
      
      try {
        const downloadUrl = await ProcessingService.sendProcessingRequest({
          projectTitle,
          files,
          areaFiles,
          userId: user.id,
          requestId
        });
        
        // Success - Show result immediately
        stopTimer();
        
        setProcessingStatus(prev => ({
          ...prev,
          status: 'completed',
          progress: PROCESSING_CONSTANTS.PROGRESS_STEPS.COMPLETED,
          message: '¡Procesamiento completado exitosamente!',
          showConfetti: true,
          requestId
        }));
        
        setResultUrl(downloadUrl);
        
        // Save processed file
        await saveProcessedFile(projectTitle, 'Multi-área', downloadUrl);
        
        // Save result to database
        const totalFilesCount = calculateTotalFiles(areaFiles, files);
        await ProcessingService.saveJobToDatabase(
          requestId,
          projectTitle,
          totalFilesCount,
          user.id,
          'completed',
          downloadUrl
        );
        
        toast({
          title: "¡Procesamiento Completado!",
          description: `Tu archivo ha sido procesado correctamente. ID: ${requestId}`,
        });
        
      } catch (processingError: any) {
        if (processingError.message === 'TIMEOUT') {
          // Timeout handling
          console.log(`⏰ [${requestId}] Timeout de 15 minutos alcanzado`);
          
          stopTimer();
          
          setProcessingStatus(prev => ({
            ...prev,
            status: 'timeout',
            message: 'El servidor no respondió dentro del tiempo límite de 15 minutos. Puedes intentar nuevamente.',
            showConfetti: false
          }));
          
          toast({
            title: "Tiempo Límite Alcanzado",
            description: `El procesamiento excedió los 15 minutos. (ID: ${requestId})`,
            variant: "destructive",
          });
          
          // Save timeout to database
          const totalFilesCount = calculateTotalFiles(areaFiles, files);
          await ProcessingService.saveJobToDatabase(
            requestId,
            projectTitle,
            totalFilesCount,
            user.id,
            'timeout',
            undefined,
            'Timeout de 15 minutos alcanzado'
          );
        } else {
          throw processingError;
        }
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
