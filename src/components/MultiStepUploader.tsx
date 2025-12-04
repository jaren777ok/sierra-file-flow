
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
import AreaDropTargets from './upload-steps/AreaDropTargets';
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
    resultHtml,
  } = useMultiStepUpload();

  // Función para manejar el siguiente paso después de empresa
  const handleCompanyNext = useCallback(async () => {
    if (companyInfo.length === 0) {
      // No hay archivos, saltar análisis e ir a áreas fijas
      nextStep();
      return;
    }
    
    // Ir a pantalla de procesamiento
    nextStep();
    
    // Iniciar análisis en background
    const success = await analyzeCompanyInfo();
    if (success) {
      nextStep(); // Ir a pantalla de revisión
    } else {
      // Volver al paso de empresa si falló
      setCurrentStep(1);
    }
  }, [companyInfo.length, nextStep, analyzeCompanyInfo, setCurrentStep]);

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

  // Navigation removed - users access editors from Saved Files

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

  // Templates removed - users access editors from Saved Files

  const renderStep = () => {
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
          onNext={handleCompanyNext}
          onPrev={prevStep}
          disabled={hasActiveJob()}
        />
      );
    }

    // Paso 2: Procesando análisis de empresa
    if (currentStep === 2 && isAnalyzingCompany) {
      return <CompanyAnalysisProcessingScreen projectName={projectName} />;
    }

    // Paso 3: Revisión y edición del análisis (solo si hay análisis)
    if (currentStep === 3 && companyAnalysis) {
      return (
        <CompanyAnalysisReviewStep
          analysis={companyAnalysis}
          onAnalysisChange={updateCompanyAnalysis}
          onNext={nextStep}
          onRegenerate={async () => {
            setCurrentStep(2);
            const success = await analyzeCompanyInfo();
            if (success) {
              setCurrentStep(3);
            } else {
              setCurrentStep(1);
            }
          }}
        />
      );
    }

    // Calcular offset para pasos siguientes basado en si hay análisis o no
    const analysisOffset = companyInfo.length > 0 && companyAnalysis ? 3 : 1;

    // Áreas fijas (4 áreas)
    const fixedAreasStart = 1 + analysisOffset;
    const fixedAreasEnd = fixedAreasStart + 3;
    
    if (currentStep >= fixedAreasStart && currentStep <= fixedAreasEnd) {
      const areaIndex = currentStep - fixedAreasStart;
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

    // Áreas personalizadas
    const customAreasStart = fixedAreasEnd + 1;
    const customAreasEnd = customAreasStart + customAreas.length - 1;
    
    if (currentStep >= customAreasStart && currentStep <= customAreasEnd) {
      const customIndex = currentStep - customAreasStart;
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
    const reviewStep = customAreasEnd + 1;
    if (currentStep === reviewStep) {
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
    }

    // Paso final: Procesamiento/Resultado
    if (currentStep === totalSteps - 1) {
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

  // Calcular offset para determinar si estamos en pasos de subida de archivos
  const analysisOffset = companyInfo.length > 0 && companyAnalysis ? 3 : 1;
  const fixedAreasStart = 1 + analysisOffset;
  const fixedAreasEnd = fixedAreasStart + 3;
  const customAreasStart = fixedAreasEnd + 1;
  const customAreasEnd = customAreasStart + customAreas.length - 1;
  const reviewStep = customAreasEnd + 1;
  
  // Mostrar drop targets durante pasos de subida de archivos (áreas fijas, personalizadas y revisión)
  const showDropTargets = currentStep >= fixedAreasStart && currentStep <= reviewStep && !isProcessingStep;

  // Obtener el área actual para resaltarla
  const getCurrentAreaKey = () => {
    if (currentStep >= fixedAreasStart && currentStep <= fixedAreasEnd) {
      const areaIndex = currentStep - fixedAreasStart;
      return areas[areaIndex]?.key;
    }
    return undefined;
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Drop Targets Sidebar - visible during file upload steps */}
      {showDropTargets && (
        <AreaDropTargets
          areas={areas}
          areaFiles={areaFiles}
          customAreas={customAreas}
          onAreaFilesChange={updateAreaFiles}
          onCustomAreaFilesChange={updateCustomAreaFiles}
          onAddCustomArea={addCustomArea}
          currentAreaKey={getCurrentAreaKey()}
          disabled={hasActiveJob()}
        />
      )}

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
