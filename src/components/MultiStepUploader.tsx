
import React, { useEffect, useCallback, useMemo } from 'react';
import { useMultiStepUpload } from '@/hooks/useMultiStepUpload';
import ProjectNameStep from './upload-steps/ProjectNameStep';
import FileUploadStep from './upload-steps/FileUploadStep';
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
    hideConfetti
  } = useMultiStepUpload();

  // Verificar trabajo activo al cargar
  useEffect(() => {
    if (hasActiveJob()) {
      const activeInfo = getActiveJobInfo();
      if (activeInfo) {
        console.log('Found active job, jumping to processing:', activeInfo);
        
        // Configurar nombre del proyecto si no existe
        if (!projectName && activeInfo.projectName) {
          setProjectName(activeInfo.projectName);
        }
        
        // Saltar directamente al procesamiento
        jumpToProcessing();
      }
    }
  }, [hasActiveJob, getActiveJobInfo, projectName, setProjectName, jumpToProcessing]);

  // Memoizar el mensaje de alerta de trabajo activo
  const activeJobAlert = useMemo(() => {
    if (!hasActiveJob() || currentStep >= 6) return null;

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
  }, [hasActiveJob, getActiveJobInfo, currentStep, jumpToProcessing, forceCleanup]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            {/* Alerta si hay trabajo activo */}
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
            disabled={hasActiveJob()}
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
            disabled={hasActiveJob()}
            activeJob={null}
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
            projectName={projectName || getActiveJobInfo()?.projectName || ''}
            activeJob={null}
            onStartNew={startNewJob}
            onHideConfetti={hideConfetti}
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

      {/* Alert de trabajo activo */}
      {activeJobAlert}

      {/* Main Content */}
      {currentStep === 6 && (
        processingStatus.status === 'processing' || 
        processingStatus.status === 'sending' || 
        processingStatus.status === 'timeout' ||
        processingStatus.status === 'completed' ||
        hasActiveJob()
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
