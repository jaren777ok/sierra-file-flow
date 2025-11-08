
import React from 'react';
import { CheckCircle, Circle, Sparkles } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  customAreasCount: number;
}

const StepIndicator = ({ currentStep, totalSteps, customAreasCount }: StepIndicatorProps) => {
  // Construir pasos dinámicamente
  const steps = [
    { name: 'Proyecto', icon: '📝' },
    { name: 'Empresa', icon: '🏢' },
    { name: 'Comercial', icon: '💼' },
    { name: 'Operaciones', icon: '⚙️' },
    { name: 'Pricing', icon: '💰' },
    { name: 'Admin', icon: '📊' },
    // Agregar áreas personalizadas dinámicamente
    ...Array.from({ length: customAreasCount }, (_, i) => ({
      name: `Área ${i + 1}`,
      icon: '📁'
    })),
    { name: 'Revisión', icon: '👁️' }
  ];

  // Mostrar solo un subconjunto de pasos si hay demasiados
  const displaySteps = steps.length > 8 ? [
    ...steps.slice(0, 6),
    { name: `+${steps.length - 7}`, icon: '📂' },
    steps[steps.length - 1]
  ] : steps;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-1 bg-sierra-teal/20 rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-sierra-teal to-sierra-teal/80 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / (totalSteps - 2)) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="relative flex justify-between">
          {displaySteps.map((step, index) => {
            const actualIndex = steps.length > 8 && index === 6 ? steps.length - 1 : index;
            const isCompleted = actualIndex < currentStep;
            const isCurrent = actualIndex === currentStep;
            const isPending = actualIndex > currentStep;
            
            return (
              <div key={index} className="flex flex-col items-center">
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
                    actualIndex <= currentStep ? 'text-sierra-teal' : 'text-sierra-teal/50'
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
