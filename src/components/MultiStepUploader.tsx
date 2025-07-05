
import React, { useEffect, useCallback, useMemo } from 'react';
import { useMultiStepUpload } from '@/hooks/useMultiStepUpload';
import ProjectNameStep from './upload-steps/ProjectNameStep';
import FileUploadStep from './upload-steps/FileUploadStep';
import ReviewStep from './upload-steps/ReviewStep';
import FuturisticAIProcessingScreen from './upload-steps/FuturisticAIProcessingScreen';
import ResultScreen from './upload-steps/ResultScreen';
import StepIndicator from './upload-steps/StepIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MultiStepUploader = () => {
  const {
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
    setCurrentStep
  } = useMultiStepUpload();

  // Función optimizada para saltar al procesamiento
  const jumpToProcessing = useCallback(() => {
    console.log('Jumping directly to processing step');
    setCurrentStep(6);
  }, [setCurrentStep]);

  // Effect optimizado para manejo de trabajos activos
  useEffect(() => {
    // Solo ejecutar si hay un trabajo activo y no estamos en modo recuperación
    if (!activeJob || isRecovering) return;
    
    console.log('Checking active job for recovery:', {
      activeJobId: activeJob.id,
      status: activeJob.status,
      currentStep,
      isRecovering
    });
    
    // Solo recuperar si el trabajo está en procesamiento y no estamos ya en el paso correcto
    if (activeJob.status === 'processing' && currentStep < 6) {
      console.log('Recovering active processing job');
      
      // Configurar el nombre del proyecto si no existe
      if (!projectName && activeJob.project_title) {
        setProjectName(activeJob.project_title);
      }
      
      // Saltar directamente al procesamiento
      jumpToProcessing();
    }
  }, [activeJob?.id, activeJob?.status, currentStep, isRecovering, projectName, activeJob?.project_title, setProjectName, jumpToProcessing]);

  // Memoizar el estado de navegación
  const canNavigate = useMemo(() => {
    return !activeJob || (activeJob.status !== 'processing');
  }, [activeJob?.status]);

  // Memoizar el mensaje de alerta de trabajo activo
  const activeJobAlert = useMemo(() => {
    if (!activeJob || activeJob.status !== 'processing' || currentStep >= 6) return null;

    return (
      <Alert className="mb-6 border-sierra-teal/30 bg-sierra-teal/5">
        <Clock className="h-4 w-4 text-sierra-teal" />
        <AlertDescription className="text-sierra-teal">
          <div className="flex items-center justify-between">
            <div>
              <strong>Trabajo en progreso:</strong> {activeJob.project_title}
              <div className="text-sm opacity-75 mt-1">
                Iniciado: {new Date(activeJob.started_at).toLocaleString()}
              </div>
            </div>
            <button
              onClick={jumpToProcessing}
              className="bg-sierra-teal text-white px-4 py-2 rounded-lg text-sm hover:bg-sierra-teal/80 transition-colors"
            >
              Ver Progreso
            </button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }, [activeJob, currentStep, jumpToProcessing]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            {/* Alerta si hay trabajo activo */}
            {activeJob && activeJob.status === 'processing' && (
              <Alert className="mb-6 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Tienes un trabajo en procesamiento: "<strong>{activeJob.project_title}</strong>". 
                      Debes esperar a que termine antes de iniciar uno nuevo.
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <ProjectNameStep
              projectName={projectName}
              setProjectName={setProjectName}
              onNext={nextStep}
              disabled={!canNavigate}
            />
          </div>
        );
      case 1:
      case 2:
      case 3:
      case 4:
        const areaIndex = currentStep - 1;
        const area = areas[areaIndex];
        return (
          <FileUploadStep
            area={area}
            files={areaFiles[area.key]}
            onFilesChange={(files) => updateAreaFiles(area.key, files)}
            onNext={nextStep}
            onPrev={prevStep}
            disabled={!canNavigate}
          />
        );
      case 5:
        return (
          <ReviewStep
            projectName={projectName}
            areaFiles={areaFiles}
            areas={areas}
            totalFiles={getTotalFiles()}
            onNext={processAllFiles}
            onPrev={prevStep}
            disabled={!canNavigate}
            activeJob={activeJob}
          />
        );
      case 6:
        if (processingStatus.status === 'completed') {
          return (
            <ResultScreen
              processingStatus={processingStatus}
              onStartNew={resetFlow}
            />
          );
        }
        return (
          <FuturisticAIProcessingScreen
            processingStatus={processingStatus}
            projectName={projectName || activeJob?.project_title || ''}
            activeJob={activeJob}
            onStartNew={startNewJob}
          />
        );
      default:
        return null;
    }
  };

  // Mostrar loading mientras se recupera
  if (isRecovering) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sierra-teal mx-auto mb-4"></div>
          <p className="text-sierra-teal">Verificando trabajos en progreso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator - Solo mostrar si no estamos en procesamiento */}
      {currentStep < 6 && (
        <div className="mb-8">
          <StepIndicator currentStep={currentStep} />
        </div>
      )}

      {/* Alert de trabajo activo */}
      {activeJobAlert}

      {/* Main Content */}
      {currentStep === 6 && (
        processingStatus.status === 'processing' || 
        processingStatus.status === 'uploading' || 
        processingStatus.status === 'timeout' ||
        activeJob?.status === 'processing'
      ) ? (
        // Pantalla de procesamiento a pantalla completa
        renderStep()
      ) : (
        // Resto de pasos en card
        <Card className="mountain-shadow bg-gradient-to-br from-white/90 to-sierra-teal/5 backdrop-blur-sm border-sierra-teal/20">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultiStepUploader;
