
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSimpleProcessing } from '@/hooks/useSimpleProcessing';

export interface AreaFiles {
  comercial: File[];
  operaciones: File[];
  pricing: File[];
  administracion: File[];
}

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

export const useMultiStepUpload = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [areaFiles, setAreaFiles] = useState<AreaFiles>({
    comercial: [],
    operaciones: [],
    pricing: [],
    administracion: []
  });

  const { toast } = useToast();
  const {
    processingStatus,
    processFiles,
    hasActiveJob,
    getActiveJobInfo,
    forceCleanup,
    resetAll,
    hideConfetti
  } = useSimpleProcessing();

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
    const success = await processFiles(projectName, areaFiles, areas);
    if (success) {
      setCurrentStep(6);
    }
  }, [processFiles, projectName, areaFiles, areas]);

  const resetFlow = useCallback(() => {
    setCurrentStep(0);
    setProjectName('');
    setAreaFiles({
      comercial: [],
      operaciones: [],
      pricing: [],
      administracion: []
    });
    resetAll();
  }, [resetAll]);

  const startNewJob = useCallback(() => {
    const savedProjectName = projectName || getActiveJobInfo()?.projectName || '';
    
    resetFlow();
    
    if (savedProjectName) {
      setProjectName(savedProjectName);
    }
    
    toast({
      title: "🚀 Nuevo trabajo iniciado",
      description: "Puedes subir nuevos archivos y comenzar el procesamiento.",
    });
  }, [resetFlow, projectName, getActiveJobInfo, toast]);

  // Función para saltar al procesamiento (para recuperación)
  const jumpToProcessing = useCallback(() => {
    console.log('Jumping directly to processing step');
    setCurrentStep(6);
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
    hasActiveJob,
    getActiveJobInfo,
    forceCleanup,
    setCurrentStep,
    jumpToProcessing,
    hideConfetti,
    isRecovering: false, // Ya no necesitamos estado de recuperación
    activeJob: null // Ya no usamos activeJob complejo
  };
};
