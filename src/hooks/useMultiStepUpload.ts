import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import useSimpleProcessing from '@/hooks/useSimpleProcessing';
import { PROCESSING_CONSTANTS } from '@/constants/processing';
import { supabase } from '@/integrations/supabase/client';
import { CompanyAnalysisService } from '@/services/companyAnalysisService';
import type { AreaFiles, CustomArea, ProjectFiles } from '@/types/processing';

export interface StepConfig {
  key: string;
  name: string;
  icon: string;
}

export const useMultiStepUpload = () => {
  const [currentStepKey, setCurrentStepKey] = useState('project');
  const [projectName, setProjectName] = useState('');
  const [companyInfo, setCompanyInfo] = useState<File[]>([]);
  const [areaFiles, setAreaFiles] = useState<AreaFiles>({
    comercial: [],
    operaciones: [],
    pricing: [],
    administracion: []
  });
  const [customAreas, setCustomAreas] = useState<CustomArea[]>([]);
  
  // Estados para análisis de empresa
  const [companyAnalysis, setCompanyAnalysis] = useState<string>('');
  const [isAnalyzingCompany, setIsAnalyzingCompany] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { toast } = useToast();
  const {
    processingStatus,
    resultHtml,
    startProcessing,
    resetProcessing,
    hideConfetti
  } = useSimpleProcessing();

  const areas = useMemo(() => [
    { key: 'comercial' as keyof AreaFiles, name: 'Comercial', icon: '💼' },
    { key: 'operaciones' as keyof AreaFiles, name: 'Operaciones', icon: '⚙️' },
    { key: 'pricing' as keyof AreaFiles, name: 'Pricing', icon: '💰' },
    { key: 'administracion' as keyof AreaFiles, name: 'Administración', icon: '🗂️' }
  ], []);

  // Configuración dinámica de pasos - FUENTE ÚNICA DE VERDAD
  const stepConfig = useMemo((): StepConfig[] => {
    const hasAnalysis = companyInfo.length > 0;
    
    const steps: StepConfig[] = [
      { key: 'project', name: 'Proyecto', icon: '📝' },
      { key: 'company', name: 'Empresa', icon: '🏢' },
    ];
    
    // Solo agregar pasos de análisis si hay archivos de empresa
    if (hasAnalysis) {
      steps.push({ key: 'analysis_processing', name: 'Analizando', icon: '🔄' });
      steps.push({ key: 'analysis_review', name: 'Análisis', icon: '📈' });
    }
    
    // Áreas fijas
    steps.push(
      { key: 'comercial', name: 'Comercial', icon: '💼' },
      { key: 'operaciones', name: 'Operaciones', icon: '⚙️' },
      { key: 'pricing', name: 'Pricing', icon: '💰' },
      { key: 'administracion', name: 'Admin', icon: '🗂️' }
    );
    
    // Áreas personalizadas
    customAreas.forEach((area) => {
      steps.push({ key: `custom_${area.id}`, name: area.name, icon: area.icon });
    });
    
    // Revisión y procesamiento
    steps.push({ key: 'review', name: 'Revisión', icon: '👁️' });
    steps.push({ key: 'processing', name: 'Procesando', icon: '🚀' });
    
    return steps;
  }, [companyInfo.length, customAreas]);

  // Derivar índice numérico desde el key
  const currentStep = stepConfig.findIndex(s => s.key === currentStepKey);
  const totalSteps = stepConfig.length;

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

  const analyzeCompanyInfo = useCallback(async () => {
    if (companyInfo.length === 0) {
      toast({
        title: "Sin archivos",
        description: "Debes subir al menos un archivo de la empresa",
        variant: "destructive",
      });
      return false;
    }
    
    setIsAnalyzingCompany(true);
    setAnalysisError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');
      
      const analysis = await CompanyAnalysisService.sendCompanyFiles(
        companyInfo,
        user.id
      );
      
      setCompanyAnalysis(analysis);
      setIsAnalyzingCompany(false);
      return true;
    } catch (error: any) {
      console.error('Error analizando empresa:', error);
      setAnalysisError(error.message);
      setIsAnalyzingCompany(false);
      toast({
        title: "Error al analizar",
        description: "No se pudo obtener el análisis de la empresa",
        variant: "destructive",
      });
      return false;
    }
  }, [companyInfo, toast]);

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
      
      // Navigate to the new custom area key
      setCurrentStepKey(`custom_${newArea.id}`);
    }
  }, [customAreas.length, stepConfig]);

  const removeCustomArea = useCallback((id: string) => {
    setCustomAreas(prev => prev.filter(area => area.id !== id));
    // Go back to administracion if we were on the removed area
    if (currentStepKey === `custom_${id}`) {
      setCurrentStepKey('administracion');
    }
  }, [currentStepKey]);

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
    if (currentStepKey === 'project' && !projectName.trim()) {
      toast({
        title: "Campo requerido",
        description: "Ingresa el nombre del proyecto",
        variant: "destructive",
      });
      return;
    }
    
    const idx = stepConfig.findIndex(s => s.key === currentStepKey);
    if (idx < stepConfig.length - 1) {
      setCurrentStepKey(stepConfig[idx + 1].key);
    }
  }, [currentStepKey, projectName, toast, stepConfig]);

  const prevStep = useCallback(() => {
    const idx = stepConfig.findIndex(s => s.key === currentStepKey);
    if (idx > 0) {
      setCurrentStepKey(stepConfig[idx - 1].key);
    }
  }, [currentStepKey, stepConfig]);

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
      total: allFiles.length,
      hasCompanyAnalysis: !!companyAnalysis
    });

    try {
      await startProcessing(projectName, allFiles, projectFiles, companyAnalysis);
      setCurrentStepKey('processing');
      return true;
    } catch (error) {
      console.error('Error processing files:', error);
      return false;
    }
  }, [startProcessing, projectName, companyInfo, areaFiles, customAreas, toast, totalSteps, companyAnalysis]);

  const resetFlow = useCallback(() => {
    setCurrentStepKey('project');
    setProjectName('');
    setCompanyInfo([]);
    setCompanyAnalysis('');
    setIsAnalyzingCompany(false);
    setAnalysisError(null);
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
    setCurrentStepKey('processing');
  }, []);

  const goToStep = useCallback((stepKey: string) => {
    setCurrentStepKey(stepKey);
  }, []);

  // Compatibilidad: setCurrentStep numérico
  const setCurrentStep = useCallback((indexOrUpdater: number | ((prev: number) => number)) => {
    const idx = typeof indexOrUpdater === 'function' 
      ? indexOrUpdater(stepConfig.findIndex(s => s.key === currentStepKey))
      : indexOrUpdater;
    if (stepConfig[idx]) {
      setCurrentStepKey(stepConfig[idx].key);
    }
  }, [stepConfig, currentStepKey]);

  return {
    currentStep,
    currentStepKey,
    projectName,
    setProjectName,
    companyInfo,
    updateCompanyInfo,
    companyAnalysis,
    isAnalyzingCompany,
    analysisError,
    analyzeCompanyInfo,
    updateCompanyAnalysis: setCompanyAnalysis,
    areaFiles,
    updateAreaFiles,
    customAreas,
    addCustomArea,
    removeCustomArea,
    updateCustomAreaName,
    updateCustomAreaFiles,
    processingStatus,
    resultHtml,
    areas,
    totalSteps,
    stepConfig,
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
    goToStep,
    jumpToProcessing,
    hideConfetti,
    isRecovering: false,
    activeJob: null
  };
};
