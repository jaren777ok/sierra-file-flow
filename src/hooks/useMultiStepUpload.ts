import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { useProcessingPersistence } from '@/hooks/useProcessingPersistence';
import { useJobPolling } from '@/hooks/useJobPolling';
import { useAuth } from '@/contexts/AuthContext';

export interface AreaFiles {
  comercial: File[];
  operaciones: File[];
  pricing: File[];
  administracion: File[];
}

export interface ProcessingStatus {
  status: 'idle' | 'sending' | 'tracking' | 'processing' | 'completed' | 'error' | 'timeout';
  progress: number;
  timeElapsed: number;
  message?: string;
  resultUrl?: string;
  requestId?: string;
  sendTimestamp?: number;
  showConfetti?: boolean;
}

export const useMultiStepUpload = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [areaFiles, setAreaFiles] = useState<AreaFiles>({
    comercial: [],
    operaciones: [],
    pricing: [],
    administracion: []
  });
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0,
    timeElapsed: 0,
    showConfetti: false
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const { saveProcessedFile, fetchSavedFiles } = useSavedFiles();
  const { 
    activeJob, 
    isLoading: isLoadingActiveJob,
    startJobTracking,
    trackJobByRequestId,
    updateJobProgress, 
    completeJob, 
    clearActiveJob,
    getTrackingData,
    isJobWithinTimeLimit
  } = useProcessingPersistence();

  const isRecovering = isLoadingActiveJob;

  // Hook de polling mejorado
  const { startPolling, stopPolling } = useJobPolling({
    requestId: processingStatus.requestId || activeJob?.request_id || null,
    onJobCompleted: async (resultUrl: string) => {
      console.log('🎉 Job completed with URL:', resultUrl);
      
      const requestId = processingStatus.requestId || activeJob?.request_id;
      const finalProjectName = projectName || activeJob?.project_title || '';
      
      // GARANTIZAR GUARDADO: Intentar guardar el archivo
      try {
        console.log('💾 Saving processed file to database...');
        await saveProcessedFile(finalProjectName, 'multi-area', resultUrl);
        console.log('✅ File saved successfully');
        
        // Refresh la lista de archivos guardados
        await fetchSavedFiles();
        console.log('🔄 Refreshed saved files list');
      } catch (error) {
        console.error('💥 Error saving file:', error);
        // Intentar guardar de nuevo después de un segundo
        setTimeout(async () => {
          try {
            await saveProcessedFile(finalProjectName, 'multi-area', resultUrl);
            await fetchSavedFiles();
            console.log('✅ File saved on retry');
          } catch (retryError) {
            console.error('💥 Failed to save file on retry:', retryError);
          }
        }, 1000);
      }
      
      if (requestId) {
        await completeJob(requestId, resultUrl);
      }
      
      // Activar confeti y mostrar éxito
      setProcessingStatus({
        status: 'completed',
        progress: 100,
        timeElapsed: 0,
        message: '¡Informe IA generado exitosamente!',
        resultUrl: resultUrl,
        requestId,
        showConfetti: true // 🎊 ACTIVAR CONFETI
      });

      toast({
        title: "🎉 ¡Informe IA Completado!",
        description: "Tu informe ha sido procesado y guardado exitosamente.",
      });
    },
    onJobError: async (errorMessage: string) => {
      console.log('💥 Job completed with error:', errorMessage);
      
      const requestId = processingStatus.requestId || activeJob?.request_id;
      if (requestId) {
        await completeJob(requestId, undefined, errorMessage);
      }
      
      setProcessingStatus({
        status: 'error',
        progress: 0,
        timeElapsed: 0,
        message: errorMessage,
        requestId,
        showConfetti: false
      });

      toast({
        title: "💥 Error",
        description: `Error al procesar archivos: ${errorMessage}`,
        variant: "destructive",
      });
    },
    onJobTimeout: async () => {
      console.log('⏰ Job timed out after 15 minutes');
      
      setProcessingStatus({
        status: 'timeout',
        progress: 0,
        timeElapsed: 15 * 60,
        message: 'El procesamiento excedió el tiempo límite de 15 minutos. Puedes iniciar un nuevo trabajo.',
        requestId: processingStatus.requestId || activeJob?.request_id,
        showConfetti: false
      });

      // Limpiar el trabajo activo para permitir nuevos trabajos
      clearActiveJob();

      toast({
        title: "⏰ Tiempo límite alcanzado",
        description: "Puedes iniciar un nuevo procesamiento cuando gustes.",
      });
    }
  });

  const WEBHOOK_URL = 'https://primary-production-f0d1.up.railway.app/webhook-test/sierra';

  const areas = useMemo(() => [
    { key: 'comercial' as keyof AreaFiles, name: 'Comercial', icon: '💼' },
    { key: 'operaciones' as keyof AreaFiles, name: 'Operaciones', icon: '⚙️' },
    { key: 'pricing' as keyof AreaFiles, name: 'Pricing', icon: '💰' },
    { key: 'administracion' as keyof AreaFiles, name: 'Administración', icon: '📊' }
  ], []);

  const updateAreaFiles = useCallback((area: keyof AreaFiles, files: File[]) => {
    if (files.length > 5) {
      toast({
        title: "Límite excedido",
        description: "Máximo 5 archivos por área",
        variant: "destructive",
      });
      return;
    }
    
    setAreaFiles(prev => ({
      ...prev,
      [area]: files
    }));
  }, [toast]);

  const nextStep = useCallback(() => {
    if (currentStep === 0 && !projectName.trim()) {
      toast({
        title: "Campo requerido",
        description: "Ingresa el nombre del proyecto",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 6));
  }, [currentStep, projectName, toast]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const getTotalFiles = useCallback(() => {
    return Object.values(areaFiles).reduce((total, files) => total + files.length, 0);
  }, [areaFiles]);

  const processAllFiles = useCallback(async () => {
    const totalFiles = getTotalFiles();
    
    if (totalFiles === 0) {
      toast({
        title: "No hay archivos",
        description: "Sube al menos un archivo para procesar",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar autenticado para procesar archivos",
        variant: "destructive",
      });
      return;
    }

    // Verificar si ya hay un trabajo activo
    if (activeJob && activeJob.status === 'processing') {
      toast({
        title: "Trabajo en progreso",
        description: "Ya tienes un trabajo en procesamiento. Espera a que termine.",
        variant: "destructive",
      });
      return;
    }

    // Verificar si hay datos de tracking locales válidos
    const trackingData = getTrackingData();
    if (trackingData && trackingData.userId === user.id && isJobWithinTimeLimit(trackingData.sendTimestamp)) {
      toast({
        title: "Trabajo en progreso",
        description: "Ya tienes un trabajo siendo procesado. Espera a que termine.",
        variant: "destructive",
      });
      return;
    }

    // Generar request_id único
    const requestId = `req_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sendTimestamp = Date.now();

    // Iniciar tracking local (NO crear en BD)
    startJobTracking(projectName, requestId, user.id);

    // Ir al paso de procesamiento
    setCurrentStep(6);

    setProcessingStatus({
      status: 'sending',
      progress: 5,
      timeElapsed: 0,
      message: 'Preparando archivos para envío...',
      requestId,
      sendTimestamp,
      showConfetti: false
    });

    try {
      const formData = new FormData();
      let fileIndex = 0;

      // Agregar archivos con nombres específicos del área
      Object.entries(areaFiles).forEach(([areaKey, files]) => {
        const areaName = areas.find(a => a.key === areaKey)?.name || areaKey;
        files.forEach((file, index) => {
          const fileName = `${areaName}_${index + 1}.${file.name.split('.').pop()}`;
          formData.append(fileName, file);
          fileIndex++;
        });
      });

      // Agregar metadatos
      formData.append('area', 'multi-area');
      formData.append('fileCount', fileIndex.toString());
      formData.append('timestamp', new Date().toISOString());
      formData.append('titulo', projectName.trim());
      formData.append('request_id', requestId);
      formData.append('user_id', user.id);
      formData.append('send_timestamp', sendTimestamp.toString());

      setProcessingStatus(prev => ({
        ...prev,
        status: 'sending',
        progress: 15,
        message: 'Enviando archivos al webhook...'
      }));

      console.log(`📤 Sending ${fileIndex} files for project: ${projectName} with request_id: ${requestId}`);

      // Enviar a webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setProcessingStatus(prev => ({
          ...prev,
          status: 'tracking',
          progress: 25,
          message: 'Archivos enviados, esperando que N8N inicie el procesamiento...'
        }));

        // Iniciar polling
        startPolling();
        
        toast({
          title: "📤 Archivos Enviados",
          description: "Los archivos se enviaron correctamente. N8N iniciará el procesamiento pronto.",
        });

      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }

    } catch (error) {
      console.error('💥 Error al procesar archivos:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setProcessingStatus({
        status: 'error',
        progress: 0,
        timeElapsed: 0,
        message: errorMessage,
        requestId,
        showConfetti: false
      });

      toast({
        title: "💥 Error",
        description: `Error al procesar archivos: ${errorMessage}`,
        variant: "destructive",
      });
    }
  }, [areaFiles, projectName, areas, getTotalFiles, activeJob, user, startJobTracking, getTrackingData, isJobWithinTimeLimit, startPolling, toast]);

  const resetFlow = useCallback(() => {
    stopPolling();
    setCurrentStep(0);
    setProjectName('');
    setAreaFiles({
      comercial: [],
      operaciones: [],
      pricing: [],
      administracion: []
    });
    setProcessingStatus({
      status: 'idle',
      progress: 0,
      timeElapsed: 0,
      showConfetti: false
    });
    clearActiveJob();
  }, [stopPolling, clearActiveJob]);

  const startNewJob = useCallback(() => {
    const savedProjectName = projectName || activeJob?.project_title || '';
    
    resetFlow();
    
    if (savedProjectName) {
      setProjectName(savedProjectName);
    }
    
    toast({
      title: "🚀 Nuevo trabajo iniciado",
      description: "Puedes subir nuevos archivos y comenzar el procesamiento.",
    });
  }, [resetFlow, projectName, activeJob?.project_title, toast]);

  const hideConfetti = useCallback(() => {
    setProcessingStatus(prev => ({
      ...prev,
      showConfetti: false
    }));
  }, []);

  return {
    currentStep,
    projectName,
    setProjectName,
    areaFiles,
    updateAreaFiles,
    processingStatus,
    areas,
    nextStep,
    prevStep,
    processAllFiles,
    resetFlow,
    startNewJob,
    getTotalFiles,
    activeJob,
    isRecovering,
    setCurrentStep,
    hideConfetti
  };
};
