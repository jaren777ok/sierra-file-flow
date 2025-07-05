
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { useProcessingPersistence } from '@/hooks/useProcessingPersistence';
import { useJobPolling } from '@/hooks/useJobPolling';

export interface AreaFiles {
  comercial: File[];
  operaciones: File[];
  pricing: File[];
  administracion: File[];
}

export interface ProcessingStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  timeElapsed: number;
  message?: string;
  resultUrl?: string;
  requestId?: string;
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
    timeElapsed: 0
  });

  const { toast } = useToast();
  const { saveProcessedFile } = useSavedFiles();
  const { 
    activeJob, 
    isLoading: isLoadingActiveJob,
    createJob, 
    confirmWebhookReceived, 
    updateJobProgress, 
    completeJob, 
    clearActiveJob 
  } = useProcessingPersistence();

  // Estado de recuperación para mejorar UX
  const isRecovering = isLoadingActiveJob;

  // Hook de polling optimizado
  const { startPolling, stopPolling } = useJobPolling({
    requestId: processingStatus.requestId || activeJob?.request_id || null,
    onJobCompleted: async (resultUrl: string) => {
      console.log('Job completed with URL:', resultUrl);
      
      const requestId = processingStatus.requestId || activeJob?.request_id;
      if (requestId) {
        await completeJob(requestId, resultUrl);
        await saveProcessedFile(projectName || activeJob?.project_title || '', 'multi-area', resultUrl);
      }
      
      setProcessingStatus({
        status: 'completed',
        progress: 100,
        timeElapsed: 0,
        message: '¡Informe IA generado exitosamente!',
        resultUrl: resultUrl,
        requestId
      });

      toast({
        title: "¡Informe IA Completado!",
        description: "Tu informe ha sido procesado y está listo para descargar.",
      });
    },
    onJobError: async (errorMessage: string) => {
      console.log('Job completed with error:', errorMessage);
      
      const requestId = processingStatus.requestId || activeJob?.request_id;
      if (requestId) {
        await completeJob(requestId, undefined, errorMessage);
      }
      
      setProcessingStatus({
        status: 'error',
        progress: 0,
        timeElapsed: 0,
        message: errorMessage,
        requestId
      });

      toast({
        title: "Error",
        description: `Error al procesar archivos: ${errorMessage}`,
        variant: "destructive",
      });
    }
  });

  const WEBHOOK_URL = 'https://primary-production-f0d1.up.railway.app/webhook-test/sierra';

  // Memoizar areas para evitar re-renders innecesarios
  const areas = useMemo(() => [
    { key: 'comercial' as keyof AreaFiles, name: 'Comercial', icon: '💼' },
    { key: 'operaciones' as keyof AreaFiles, name: 'Operaciones', icon: '⚙️' },
    { key: 'pricing' as keyof AreaFiles, name: 'Pricing', icon: '💰' },
    { key: 'administracion' as keyof AreaFiles, name: 'Administración', icon: '📊' }
  ], []);

  // Optimizar updateAreaFiles con useCallback
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

  // Optimizar nextStep con useCallback
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

  // Optimizar getTotalFiles con useCallback
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

    // Verificar si ya hay un trabajo activo
    if (activeJob && activeJob.status === 'processing') {
      toast({
        title: "Trabajo en progreso",
        description: "Ya tienes un trabajo en procesamiento. Espera a que termine.",
        variant: "destructive",
      });
      return;
    }

    // Crear trabajo en Supabase y obtener request_id
    const requestId = await createJob(projectName, totalFiles);
    if (!requestId) {
      toast({
        title: "Error",
        description: "No se pudo crear el trabajo de procesamiento",
        variant: "destructive",
      });
      return;
    }

    // Ir al paso de procesamiento
    setCurrentStep(6);

    setProcessingStatus({
      status: 'uploading',
      progress: 5,
      timeElapsed: 0,
      message: 'Preparando archivos...',
      requestId
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

      // Agregar metadatos incluyendo el request_id
      formData.append('area', 'multi-area');
      formData.append('fileCount', fileIndex.toString());
      formData.append('timestamp', new Date().toISOString());
      formData.append('titulo', projectName.trim());
      formData.append('request_id', requestId);

      await updateJobProgress(requestId, 15);
      setProcessingStatus(prev => ({
        ...prev,
        status: 'processing',
        progress: 15,
        message: 'Enviando archivos a la IA...'
      }));

      console.log(`Procesando ${fileIndex} archivos para proyecto: ${projectName} con request_id: ${requestId}`);

      // Enviar a webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Webhook confirmó recepción
        await confirmWebhookReceived(requestId);
        
        setProcessingStatus(prev => ({
          ...prev,
          progress: 20,
          message: 'Webhook confirmada, IA procesando archivos...'
        }));

        // Iniciar polling
        startPolling();
        
        toast({
          title: "Procesamiento Iniciado",
          description: "La IA está procesando tus archivos. Puedes cerrar la app y regresar más tarde.",
        });

      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }

    } catch (error) {
      console.error('Error al procesar archivos:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      await completeJob(requestId, undefined, errorMessage);
      
      setProcessingStatus({
        status: 'error',
        progress: 0,
        timeElapsed: 0,
        message: errorMessage,
        requestId
      });

      toast({
        title: "Error",
        description: `Error al procesar archivos: ${errorMessage}`,
        variant: "destructive",
      });
    }
  }, [areaFiles, projectName, areas, getTotalFiles, activeJob, createJob, updateJobProgress, confirmWebhookReceived, completeJob, startPolling, toast]);

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
      timeElapsed: 0
    });
    clearActiveJob();
  }, [stopPolling, clearActiveJob]);

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
    getTotalFiles,
    activeJob,
    isRecovering,
    setCurrentStep
  };
};
