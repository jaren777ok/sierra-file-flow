import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import useSimpleProcessing from '@/hooks/useSimpleProcessing';
import { PROCESSING_CONSTANTS } from '@/constants/processing';

export interface AreaFiles {
  comercial: File[];
  operaciones: File[];
  pricing: File[];
  administracion: File[];
}

export interface CustomArea {
  id: string;
  name: string;
  icon: string;
  files: File[];
}

export interface ProjectFiles {
  companyInfo: File[];
  areas: AreaFiles;
  customAreas: CustomArea[];
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
  const [companyInfo, setCompanyInfo] = useState<File[]>([]);
  const [areaFiles, setAreaFiles] = useState<AreaFiles>({
    comercial: [],
    operaciones: [],
    pricing: [],
    administracion: []
  });
  const [customAreas, setCustomAreas] = useState<CustomArea[]>([]);

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

  // Calcular total de pasos dinámicamente
  const totalSteps = useMemo(() => {
    // 2 (nombre + empresa) + 4 (áreas fijas) + N (custom) + 1 (review) + 1 (processing)
    return 2 + 4 + customAreas.length + 2;
  }, [customAreas.length]);

  const updateAreaFiles = useCallback((area: keyof AreaFiles, files: File[]) => {
    if (files.length > PROCESSING_CONSTANTS.MAX_FILES_PER_AREA) {
      toast({
        title: "Límite excedido",
        description: `Máximo ${PROCESSING_CONSTANTS.MAX_FILES_PER_AREA} archivos por área`,
        variant: "destructive",
      });
      return;
    }
    
    setAreaFiles(prev => ({
      ...prev,
      [area]: files
    }));
  }, [toast]);

  const updateCompanyInfo = useCallback((files: File[]) => {
    if (files.length > PROCESSING_CONSTANTS.MAX_FILES_PER_AREA) {
      toast({
        title: "Límite excedido",
        description: `Máximo ${PROCESSING_CONSTANTS.MAX_FILES_PER_AREA} archivos para información de empresa`,
        variant: "destructive",
      });
      return;
    }
    setCompanyInfo(files);
  }, [toast]);

  const addCustomArea = useCallback(() => {
    const name = prompt('¿Cómo quieres llamar a esta área?', 'Área Personalizada');
    if (name && name.trim()) {
      const iconIndex = customAreas.length % PROCESSING_CONSTANTS.CUSTOM_AREA_ICONS.length;
      const newArea: CustomArea = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        icon: PROCESSING_CONSTANTS.CUSTOM_AREA_ICONS[iconIndex],
        files: []
      };
      setCustomAreas(prev => [...prev, newArea]);
      // Saltar al paso del área recién creada
      setCurrentStep(6 + customAreas.length);
    }
  }, [customAreas.length]);

  const removeCustomArea = useCallback((id: string) => {
    setCustomAreas(prev => prev.filter(area => area.id !== id));
    // Volver al paso anterior
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const updateCustomAreaName = useCallback((id: string, name: string) => {
    setCustomAreas(prev => 
      prev.map(area => area.id === id ? { ...area, name } : area)
    );
  }, []);

  const updateCustomAreaFiles = useCallback((id: string, files: File[]) => {
    if (files.length > PROCESSING_CONSTANTS.MAX_FILES_PER_AREA) {
      toast({
        title: "Límite excedido",
        description: `Máximo ${PROCESSING_CONSTANTS.MAX_FILES_PER_AREA} archivos por área`,
        variant: "destructive",
      });
      return;
    }
    
    setCustomAreas(prev =>
      prev.map(area => area.id === id ? { ...area, files } : area)
    );
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
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, [currentStep, projectName, toast, totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const getTotalFiles = useCallback(() => {
    const companyInfoCount = companyInfo.length;
    const areasCount = Object.values(areaFiles).reduce((total, files) => total + files.length, 0);
    const customCount = customAreas.reduce((total, area) => total + area.files.length, 0);
    return companyInfoCount + areasCount + customCount;
  }, [companyInfo, areaFiles, customAreas]);

  const getAreaSummary = useCallback(() => {
    const summary: string[] = [];
    
    if (companyInfo.length > 0) {
      summary.push(`Empresa: ${companyInfo.length} archivo${companyInfo.length > 1 ? 's' : ''}`);
    }
    
    Object.entries(areaFiles)
      .filter(([, files]) => files.length > 0)
      .forEach(([area, files]) => {
        summary.push(`${area}: ${files.length} archivo${files.length > 1 ? 's' : ''}`);
      });
    
    customAreas
      .filter(area => area.files.length > 0)
      .forEach(area => {
        summary.push(`${area.name}: ${area.files.length} archivo${area.files.length > 1 ? 's' : ''}`);
      });
    
    return summary.length > 0 ? summary.join(', ') : 'Sin archivos';
  }, [companyInfo, areaFiles, customAreas]);

  const processAllFiles = useCallback(async () => {
    const allFiles = [
      ...companyInfo,
      ...Object.values(areaFiles).flat(),
      ...customAreas.flatMap(area => area.files)
    ];
    
    if (allFiles.length === 0) {
      toast({
        title: "Sin archivos",
        description: "No hay archivos para procesar",
        variant: "destructive",
      });
      return false;
    }

    const projectFiles: ProjectFiles = {
      companyInfo,
      areas: areaFiles,
      customAreas
    };

    console.log('📊 Procesando archivos:', {
      companyInfo: companyInfo.length,
      comercial: areaFiles.comercial.length,
      operaciones: areaFiles.operaciones.length,
      pricing: areaFiles.pricing.length,
      administracion: areaFiles.administracion.length,
      customAreas: customAreas.map(a => ({ name: a.name, files: a.files.length })),
      total: allFiles.length
    });

    try {
      await startProcessing(projectName, allFiles, projectFiles);
      setCurrentStep(totalSteps - 1); // Último paso (processing)
      return true;
    } catch (error) {
      console.error('Error processing files:', error);
      return false;
    }
  }, [startProcessing, projectName, companyInfo, areaFiles, customAreas, toast, totalSteps]);

  const resetFlow = useCallback(() => {
    setCurrentStep(0);
    setProjectName('');
    setCompanyInfo([]);
    setAreaFiles({
      comercial: [],
      operaciones: [],
      pricing: [],
      administracion: []
    });
    setCustomAreas([]);
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
    setCurrentStep(totalSteps - 1);
  }, [totalSteps]);

  return {
    currentStep,
    projectName,
    setProjectName,
    companyInfo,
    updateCompanyInfo,
    areaFiles,
    updateAreaFiles,
    customAreas,
    addCustomArea,
    removeCustomArea,
    updateCustomAreaName,
    updateCustomAreaFiles,
    processingStatus,
    areas,
    totalSteps,
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
