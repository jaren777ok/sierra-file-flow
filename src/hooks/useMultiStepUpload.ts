import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import useSimpleProcessing from '@/hooks/useSimpleProcessing';

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
    startProcessing,
    resetProcessing,
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

  const getAreaSummary = useCallback(() => {
    const summary = Object.entries(areaFiles)
      .filter(([, files]) => files.length > 0)
      .map(([area, files]) => `${area}: ${files.length} archivo${files.length > 1 ? 's' : ''}`);
    
    return summary.length > 0 ? summary.join(', ') : 'Sin archivos';
  }, [areaFiles]);

  const processAllFiles = useCallback(async () => {
    const allFiles = Object.values(areaFiles).flat();
    
    if (allFiles.length === 0) {
      toast({
        title: "Sin archivos",
        description: "No hay archivos para procesar",
        variant: "destructive",
      });
      return false;
    }

    console.log('📊 Procesando archivos por área:', {
      comercial: areaFiles.comercial.length,
      operaciones: areaFiles.operaciones.length,
      pricing: areaFiles.pricing.length,
      administracion: areaFiles.administracion.length,
      total: allFiles.length
    });

    try {
      // Pasar tanto los archivos como la información de áreas
      await startProcessing(projectName, allFiles, areaFiles);
      setCurrentStep(6);
      return true;
    } catch (error) {
      console.error('Error processing files:', error);
      return false;
    }
  }, [startProcessing, projectName, areaFiles, toast]);

  const resetFlow = useCallback(() => {
    setCurrentStep(0);
    setProjectName('');
    setAreaFiles({
      comercial: [],
      operaciones: [],
      pricing: [],
      administracion: []
    });
    resetProcessing();
  }, [resetProcessing]);

  const startNewJob = useCallback(() => {
    resetFlow();
    
    toast({
      title: "🚀 Nuevo trabajo iniciado",
      description: "Puedes subir nuevos archivos y comenzar el procesamiento.",
    });
  }, [resetFlow, toast]);

  const hasActiveJob = useCallback(() => {
    return processingStatus.status === 'processing' || processingStatus.status === 'sending';
  }, [processingStatus.status]);

  const getActiveJobInfo = useCallback(() => {
    if (!hasActiveJob()) return null;
    
    return {
      projectName: projectName,
      sendTimestamp: Date.now() - (processingStatus.timeElapsed * 1000)
    };
  }, [hasActiveJob, projectName, processingStatus.timeElapsed]);

  const forceCleanup = useCallback(() => {
    resetFlow();
    toast({
      title: "Limpieza forzada",
      description: "Se ha limpiado el trabajo actual",
    });
  }, [resetFlow, toast]);

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
    getAreaSummary,
    hasActiveJob,
    getActiveJobInfo,
    forceCleanup,
    setCurrentStep,
    jumpToProcessing,
    hideConfetti,
    isRecovering: false,
    activeJob: null
  };
};
