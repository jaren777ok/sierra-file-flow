
import React from 'react';
import { CheckCircle, Circle, Sparkles } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const steps = [
    { name: 'Proyecto', icon: '📝' },
    { name: 'Comercial', icon: '💼' },
    { name: 'Operaciones', icon: '⚙️' },
    { name: 'Pricing', icon: '💰' },
    { name: 'Administración', icon: '📊' },
    { name: 'Revisión', icon: '👁️' }
  ];

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-1 bg-sierra-teal/20 rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-sierra-teal to-sierra-teal/80 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="relative flex justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  index < currentStep 
                    ? 'bg-sierra-teal text-white shadow-lg scale-110' 
                    : index === currentStep
                    ? 'bg-white border-2 border-sierra-teal text-sierra-teal shadow-lg scale-110 animate-pulse'
                    : 'bg-white border-2 border-sierra-teal/30 text-sierra-teal/50'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : index === currentStep ? (
                  <Sparkles className="h-5 w-5 animate-spin" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              
              <div className="mt-3 text-center">
                <div className="text-lg mb-1">{step.icon}</div>
                <p className={`text-xs font-medium transition-colors ${
                  index <= currentStep ? 'text-sierra-teal' : 'text-sierra-teal/50'
                }`}>
                  {step.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
