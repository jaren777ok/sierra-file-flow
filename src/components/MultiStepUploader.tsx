
import React, { useEffect, useCallback, useMemo } from 'react';
import { useMultiStepUpload } from '@/hooks/useMultiStepUpload';
import ProjectNameStep from './upload-steps/ProjectNameStep';
import CompanyInfoStep from './upload-steps/CompanyInfoStep';
import FileUploadStep from './upload-steps/FileUploadStep';
import CustomAreaUploadStep from './upload-steps/CustomAreaUploadStep';
import ReviewStep from './upload-steps/ReviewStep';
import FuturisticAIProcessingScreen from './upload-steps/FuturisticAIProcessingScreen';
import ResultScreen from './upload-steps/ResultScreen';
import StepIndicator from './upload-steps/StepIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Clock, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const MultiStepUploader = () => {
  const {
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
    hasActiveJob,
    getActiveJobInfo,
    forceCleanup,
    setCurrentStep,
    jumpToProcessing,
    hideConfetti
  } = useMultiStepUpload();

  // Verificar trabajo activo al cargar
  useEffect(() => {
    if (hasActiveJob()) {
      const activeInfo = getActiveJobInfo();
      if (activeInfo) {
        console.log('Found active job, jumping to processing:', activeInfo);
        
        if (!projectName && activeInfo.projectName) {
          setProjectName(activeInfo.projectName);
        }
        
        jumpToProcessing();
      }
    }
  }, [hasActiveJob, getActiveJobInfo, projectName, setProjectName, jumpToProcessing]);

  const activeJobAlert = useMemo(() => {
    if (!hasActiveJob() || currentStep >= totalSteps - 1) return null;

    const activeInfo = getActiveJobInfo();
    if (!activeInfo) return null;

    const elapsedMinutes = Math.floor((Date.now() - activeInfo.sendTimestamp) / 60000);

    return (
      <Alert className="mb-6 border-sierra-teal/30 bg-sierra-teal/5">
        <Clock className="h-4 w-4 text-sierra-teal" />
        <AlertDescription className="text-sierra-teal">
          <div className="flex items-center justify-between">
            <div>
              <strong>Trabajo en progreso:</strong> {activeInfo.projectName}
              <div className="text-sm opacity-75 mt-1">
                Iniciado hace: {elapsedMinutes} minutos
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={jumpToProcessing}
                className="bg-sierra-teal text-white px-4 py-2 rounded-lg text-sm hover:bg-sierra-teal/80 transition-colors"
              >
                Ver Progreso
              </button>
              <button
                onClick={forceCleanup}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Limpiar
              </button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }, [hasActiveJob, getActiveJobInfo, currentStep, totalSteps, jumpToProcessing, forceCleanup]);

  const renderStep = () => {
    // Paso 0: Nombre del proyecto
    if (currentStep === 0) {
      return (
        <div>
          {hasActiveJob() && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Tienes un trabajo en procesamiento: "<strong>{getActiveJobInfo()?.projectName}</strong>". 
                      Debes esperar a que termine antes de iniciar uno nuevo.
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={forceCleanup}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Forzar Limpieza
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <ProjectNameStep
            projectName={projectName}
            setProjectName={setProjectName}
            onNext={nextStep}
            disabled={hasActiveJob()}
          />
        </div>
      );
    }

    // Paso 1: Información de la empresa
    if (currentStep === 1) {
      return (
        <CompanyInfoStep
          files={companyInfo}
          onFilesChange={updateCompanyInfo}
          onNext={nextStep}
          onPrev={prevStep}
          disabled={hasActiveJob()}
        />
      );
    }

    // Pasos 2-5: Áreas fijas
    if (currentStep >= 2 && currentStep <= 5) {
      const areaIndex = currentStep - 2;
      const area = areas[areaIndex];
      return (
        <FileUploadStep
          area={area}
          files={areaFiles[area.key]}
          onFilesChange={(files) => updateAreaFiles(area.key, files)}
          onNext={nextStep}
          onPrev={prevStep}
          disabled={hasActiveJob()}
        />
      );
    }

    // Pasos dinámicos: Áreas personalizadas
    if (currentStep >= 6 && currentStep < 6 + customAreas.length) {
      const customIndex = currentStep - 6;
      const customArea = customAreas[customIndex];
      return (
        <CustomAreaUploadStep
          area={customArea}
          onNameChange={updateCustomAreaName}
          onFilesChange={updateCustomAreaFiles}
          onRemoveArea={removeCustomArea}
          onAddAnotherArea={addCustomArea}
          onNext={nextStep}
          onPrev={prevStep}
          disabled={hasActiveJob()}
          showAddAnother={true}
        />
      );
    }

    // Paso de revisión
    if (currentStep === 6 + customAreas.length) {
      return (
        <ReviewStep
          projectName={projectName}
          companyInfo={companyInfo}
          areaFiles={areaFiles}
          customAreas={customAreas}
          areas={areas}
          totalFiles={getTotalFiles()}
          onNext={processAllFiles}
          onPrev={prevStep}
          onAddCustomArea={addCustomArea}
          disabled={hasActiveJob()}
          activeJob={null}
        />
      );
    }

    // Paso final: Procesamiento/Resultado
    if (currentStep === totalSteps - 1) {
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
          projectName={projectName || getActiveJobInfo()?.projectName || ''}
          activeJob={null}
          onStartNew={startNewJob}
          onHideConfetti={hideConfetti}
        />
      );
    }

    return null;
  };

  const isProcessingStep = currentStep === totalSteps - 1 && (
    processingStatus.status === 'processing' || 
    processingStatus.status === 'sending' || 
    processingStatus.status === 'timeout' ||
    processingStatus.status === 'completed' ||
    hasActiveJob()
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator */}
      {!isProcessingStep && (
        <div className="mb-8">
          <StepIndicator 
            currentStep={currentStep} 
            totalSteps={totalSteps}
            customAreasCount={customAreas.length}
          />
        </div>
      )}

      {/* Alert de trabajo activo */}
      {activeJobAlert}

      {/* Main Content */}
      {isProcessingStep ? (
        renderStep()
      ) : (
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
