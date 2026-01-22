import React from 'react';
import { CheckCircle, Circle, Sparkles } from 'lucide-react';
import type { StepConfig } from '@/hooks/useMultiStepUpload';

interface StepIndicatorProps {
  currentStep: number;
  stepConfig: StepConfig[];
}

const StepIndicator = ({ currentStep, stepConfig }: StepIndicatorProps) => {
  // Filtrar pasos de procesamiento para el indicador visual
  const visibleSteps = stepConfig.filter(step => 
    step.key !== 'analysis_processing' && step.key !== 'processing'
  );

  // Calcular el índice visual correcto
  const getVisualIndex = (actualStep: number) => {
    let visualIndex = 0;
    for (let i = 0; i < actualStep && i < stepConfig.length; i++) {
      const step = stepConfig[i];
      if (step.key !== 'analysis_processing' && step.key !== 'processing') {
        visualIndex++;
      }
    }
    return visualIndex;
  };

  const currentVisualIndex = getVisualIndex(currentStep);

  // Mostrar solo un subconjunto de pasos si hay demasiados
  const displaySteps = visibleSteps.length > 8 ? [
    ...visibleSteps.slice(0, 6),
    { key: 'more', name: `+${visibleSteps.length - 7}`, icon: '📂' },
    visibleSteps[visibleSteps.length - 1]
  ] : visibleSteps;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-1 bg-sierra-teal/20 rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-sierra-teal to-sierra-teal/80 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min((currentVisualIndex / (visibleSteps.length - 1)) * 100, 100)}%` }}
            />
          </div>
        </div>
        
        <div className="relative flex justify-between">
          {displaySteps.map((step, displayIndex) => {
            // Para el indicador "+N", usar el índice real del último paso
            const isMoreIndicator = step.key === 'more';
            const actualVisibleIndex = isMoreIndicator 
              ? visibleSteps.length - 2 
              : displaySteps.length > 8 && displayIndex === displaySteps.length - 1
                ? visibleSteps.length - 1
                : displayIndex;
            
            const isCompleted = actualVisibleIndex < currentVisualIndex;
            const isCurrent = actualVisibleIndex === currentVisualIndex;
            const isPending = actualVisibleIndex > currentVisualIndex;
            
            return (
              <div key={step.key} className="flex flex-col items-center">
                <div 
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-sierra-teal text-white shadow-lg scale-110' 
                      : isCurrent
                      ? 'bg-white border-2 border-sierra-teal text-sierra-teal shadow-lg scale-110 animate-pulse'
                      : 'bg-white border-2 border-sierra-teal/30 text-sierra-teal/50'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Sparkles className="h-5 w-5 animate-spin" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                
                <div className="mt-3 text-center">
                  <div className="text-lg mb-1">{step.icon}</div>
                  <p className={`text-xs font-medium transition-colors ${
                    isCompleted || isCurrent ? 'text-sierra-teal' : 'text-sierra-teal/50'
                  }`}>
                    {step.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
