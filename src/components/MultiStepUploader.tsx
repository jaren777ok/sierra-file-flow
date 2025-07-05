
import React, { useEffect } from 'react';
import { useMultiStepUpload } from '@/hooks/useMultiStepUpload';
import ProjectNameStep from './upload-steps/ProjectNameStep';
import FileUploadStep from './upload-steps/FileUploadStep';
import ReviewStep from './upload-steps/ReviewStep';
import FuturisticAIProcessingScreen from './upload-steps/FuturisticAIProcessingScreen';
import ResultScreen from './upload-steps/ResultScreen';
import StepIndicator from './upload-steps/StepIndicator';
import { Card, CardContent } from '@/components/ui/card';

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

  // Efecto para detectar trabajo activo y saltar al paso de procesamiento
  useEffect(() => {
    if (activeJob && activeJob.status === 'processing' && currentStep < 6) {
      // Si hay un trabajo activo, saltar al paso de procesamiento
      setProjectName(activeJob.project_title);
      // Ir directamente al paso 6 (procesamiento)
      for (let i = currentStep; i < 6; i++) {
        nextStep();
      }
    }
  }, [activeJob, currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ProjectNameStep
            projectName={projectName}
            setProjectName={setProjectName}
            onNext={nextStep}
          />
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
