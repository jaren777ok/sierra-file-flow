
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSavedFiles } from '@/hooks/useSavedFiles';

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

  const WEBHOOK_URL = 'https://primary-production-f0d1.up.railway.app/webhook-test/sierra';
  const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutos

  const areas = [
    { key: 'comercial' as keyof AreaFiles, name: 'Comercial', icon: '💼' },
    { key: 'operaciones' as keyof AreaFiles, name: 'Operaciones', icon: '⚙️' },
    { key: 'pricing' as keyof AreaFiles, name: 'Pricing', icon: '💰' },
    { key: 'administracion' as keyof AreaFiles, name: 'Administración', icon: '📊' }
  ];

  const updateAreaFiles = (area: keyof AreaFiles, files: File[]) => {
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
  };

  const nextStep = () => {
    if (currentStep === 0 && !projectName.trim()) {
      toast({
        title: "Campo requerido",
        description: "Ingresa el nombre del proyecto",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const getTotalFiles = () => {
    return Object.values(areaFiles).reduce((total, files) => total + files.length, 0);
  };

  const processAllFiles = async () => {
    if (getTotalFiles() === 0) {
      toast({
        title: "No hay archivos",
        description: "Sube al menos un archivo para procesar",
        variant: "destructive",
      });
      return;
    }

    setProcessingStatus({
      status: 'uploading',
      progress: 10,
      timeElapsed: 0,
      message: 'Preparando archivos...'
    });

    // Start timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setProcessingStatus(prev => ({
        ...prev,
        timeElapsed: elapsed
      }));
    }, 1000);

    try {
      const formData = new FormData();
      let fileIndex = 0;

      // Add files with area-specific naming
      Object.entries(areaFiles).forEach(([areaKey, files]) => {
        files.forEach((file, index) => {
          const areaName = areas.find(a => a.key === areaKey)?.name || areaKey;
          formData.append(`file${fileIndex}`, file);
          formData.append(`filename${fileIndex}`, `${areaName}${index}`);
          fileIndex++;
        });
      });

      formData.append('area', 'multi-area');
      formData.append('fileCount', fileIndex.toString());
      formData.append('timestamp', new Date().toISOString());
      formData.append('Título', projectName.trim());

      setProcessingStatus(prev => ({
        ...prev,
        status: 'processing',
        progress: 30,
        message: 'Enviando archivos a la IA...'
      }));

      console.log(`Procesando ${fileIndex} archivos para proyecto: ${projectName}`);

      const uploadPromise = fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La operación tardó más de 15 minutos')), TIMEOUT_DURATION);
      });

      const response = await Promise.race([uploadPromise, timeoutPromise]) as Response;

      setProcessingStatus(prev => ({
        ...prev,
        progress: 60,
        message: 'IA procesando archivos...'
      }));

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const jsonResponse = await response.json();
          console.log('Respuesta JSON recibida:', jsonResponse);
          
          let driveUrl = null;
          if (Array.isArray(jsonResponse) && jsonResponse.length > 0) {
            if (jsonResponse[0].EXITO) {
              driveUrl = jsonResponse[0].EXITO;
            }
          }
          
          if (driveUrl) {
            await saveProcessedFile(projectName, 'multi-area', driveUrl);
            
            setProcessingStatus({
              status: 'completed',
              progress: 100,
              timeElapsed: Math.floor((Date.now() - startTime) / 1000),
              message: '¡Informe IA generado exitosamente!',
              resultUrl: driveUrl
            });

            toast({
              title: "¡Informe IA Completado!",
              description: "Tu informe ha sido procesado y está listo para descargar.",
            });
          } else {
            setProcessingStatus(prev => ({
              ...prev,
              progress: 80,
              message: 'Finalizando procesamiento...'
            }));
            
            setTimeout(() => {
              setProcessingStatus({
                status: 'completed',
                progress: 100,
                timeElapsed: Math.floor((Date.now() - startTime) / 1000),
                message: '¡Procesamiento completado! Revisa "Archivos Guardados".'
              });
            }, 3000);
          }
        }
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }

    } catch (error) {
      console.error('Error al procesar archivos:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setProcessingStatus({
        status: 'error',
        progress: 0,
        timeElapsed: Math.floor((Date.now() - startTime) / 1000),
        message: errorMessage
      });

      toast({
        title: "Error",
        description: `Error al procesar archivos: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      clearInterval(timer);
    }
  };

  const resetFlow = () => {
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
  };

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
    getTotalFiles
  };
};
