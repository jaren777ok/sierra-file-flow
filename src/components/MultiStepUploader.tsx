import React, { useEffect, useCallback, useMemo } from 'react';
import { useMultiStepUpload } from '@/hooks/useMultiStepUpload';
import ProjectNameStep from './upload-steps/ProjectNameStep';
import CompanyInfoStep from './upload-steps/CompanyInfoStep';
import CompanyAnalysisProcessingScreen from './upload-steps/CompanyAnalysisProcessingScreen';
import CompanyAnalysisReviewStep from './upload-steps/CompanyAnalysisReviewStep';
import FileUploadStep from './upload-steps/FileUploadStep';
import CustomAreaUploadStep from './upload-steps/CustomAreaUploadStep';
import ReviewStep from './upload-steps/ReviewStep';
import FuturisticAIProcessingScreen from './upload-steps/FuturisticAIProcessingScreen';
import { ResultScreen } from './upload-steps/ResultScreen';
import StepIndicator from './upload-steps/StepIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Clock, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const MultiStepUploader = () => {
  const {
    currentStep,
    currentStepKey,
    projectName,
    setProjectName,
    companyInfo,
    updateCompanyInfo,
    companyAnalysis,
    isAnalyzingCompany,
    analyzeCompanyInfo,
    updateCompanyAnalysis,
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
    stepConfig,
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
    goToStep,
    jumpToProcessing,
    hideConfetti,
    resultHtml,
  } = useMultiStepUpload();

  // Función para manejar el siguiente paso después de empresa
  const handleCompanyNext = useCallback(async () => {
    if (companyInfo.length === 0) {
      // No hay archivos, saltar análisis e ir directamente a comercial
      goToStep('comercial');
      return;
    }
    
    // Ir a pantalla de procesamiento de análisis
    goToStep('analysis_processing');
    
    // Iniciar análisis en background
    const success = await analyzeCompanyInfo();
    if (success) {
      goToStep('analysis_review');
    } else {
      goToStep('company');
    }
  }, [companyInfo.length, goToStep, analyzeCompanyInfo]);

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
    if (!hasActiveJob() || currentStepKey === 'processing') return null;

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
  }, [hasActiveJob, getActiveJobInfo, currentStepKey, jumpToProcessing, forceCleanup]);

  // Renderizar paso basado en stepKey - FUENTE ÚNICA DE VERDAD
  const renderStep = () => {
    switch (currentStepKey) {
      case 'project':
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

      case 'company':
        return (
          <CompanyInfoStep
            files={companyInfo}
            onFilesChange={updateCompanyInfo}
            onNext={handleCompanyNext}
            onPrev={prevStep}
            disabled={hasActiveJob()}
          />
        );

      case 'analysis_processing':
        return <CompanyAnalysisProcessingScreen projectName={projectName} />;

      case 'analysis_review':
        return (
          <CompanyAnalysisReviewStep
            analysis={companyAnalysis}
            onAnalysisChange={updateCompanyAnalysis}
            onNext={nextStep}
            onRegenerate={async () => {
              goToStep('analysis_processing');
              const success = await analyzeCompanyInfo();
              if (success) {
                goToStep('analysis_review');
              } else {
                goToStep('company');
              }
            }}
          />
        );

      case 'comercial':
      case 'operaciones':
      case 'pricing':
      case 'administracion': {
        const area = areas.find(a => a.key === currentStepKey);
        if (!area) return null;
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

      case 'review':
        return (
          <ReviewStep
            projectName={projectName}
            companyInfo={companyInfo}
            companyAnalysis={companyAnalysis}
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

      case 'processing':
        if (processingStatus.status === 'completed') {
          return (
            <ResultScreen
              projectTitle={projectName}
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
        // Manejar áreas personalizadas (keys que empiezan con 'custom_')
        if (currentStepKey.startsWith('custom_')) {
          const customAreaId = currentStepKey.replace('custom_', '');
          const customArea = customAreas.find(a => a.id === customAreaId);
          if (customArea) {
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
        }
        return null;
    }
  };

  const isProcessingStep = currentStepKey === 'processing' && (
    processingStatus.status === 'processing' || 
    processingStatus.status === 'sending' || 
    processingStatus.status === 'timeout' ||
    processingStatus.status === 'completed' ||
    hasActiveJob()
  );

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Step Indicator */}
      {!isProcessingStep && (
        <div className="mb-8">
          <StepIndicator 
            currentStep={currentStep} 
            stepConfig={stepConfig}
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
