
import React, { useEffect, useCallback } from 'react';
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
    getTotalFiles,
    activeJob
  } = useMultiStepUpload();

  // Función para saltar al procesamiento
  const jumpToProcessing = useCallback(() => {
    if (currentStep < 6) {
      // Saltar directamente al paso 6 sin bucles
      while (currentStep < 6) {
        nextStep();
      }
    }
  }, [currentStep, nextStep]);

  // Efecto para manejar trabajo activo - SIMPLIFICADO
  useEffect(() => {
    console.log('Checking for active job...', { activeJob, currentStep });
    
    if (activeJob && activeJob.status === 'processing' && currentStep < 6) {
      console.log('Active job detected, setting up recovery');
      
      // Configurar el nombre del proyecto si no existe
      if (!projectName && activeJob.project_title) {
        console.log('Setting project name from active job:', activeJob.project_title);
        setProjectName(activeJob.project_title);
      }
      
      // Saltar al procesamiento de forma segura
      console.log('Jumping to processing step');
      jumpToProcessing();
    }
  }, [activeJob?.status, activeJob?.project_title]); // Dependencias específicas

  // Prevenir navegación si hay trabajo activo
  const canNavigate = !activeJob || activeJob.status !== 'processing';

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
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator - Solo mostrar si no estamos en procesamiento */}
      {currentStep < 6 && (
        <div className="mb-8">
          <StepIndicator currentStep={currentStep} />
        </div>
      )}

      {/* Indicador de trabajo activo en el header */}
      {activeJob && activeJob.status === 'processing' && currentStep < 6 && (
        <div className="mb-6">
          <Alert className="border-sierra-teal/30 bg-sierra-teal/5">
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
        </div>
      )}

      {/* Main Content */}
      {currentStep === 6 && (processingStatus.status === 'processing' || processingStatus.status === 'uploading' || activeJob?.status === 'processing') ? (
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
