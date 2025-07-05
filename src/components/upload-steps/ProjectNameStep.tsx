
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ProjectNameStepProps {
  projectName: string;
  setProjectName: (name: string) => void;
  onNext: () => void;
  disabled?: boolean;
}

const ProjectNameStep = ({ projectName, setProjectName, onNext, disabled = false }: ProjectNameStepProps) => {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-sierra-teal/10 px-4 py-2 rounded-full mb-6">
          <Sparkles className="h-5 w-5 text-sierra-teal animate-pulse" />
          <span className="text-sierra-teal font-medium">Paso 1 de 6</span>
        </div>
        
        <h2 className="text-3xl font-bold text-sierra-teal mb-4">
          Nombre del Proyecto
        </h2>
        <p className="text-sierra-gray text-lg">
          Dale un nombre identificativo a tu proyecto. Este será usado para organizar tus archivos procesados.
        </p>
      </div>

      <div className="mb-8">
        <Label htmlFor="project-name" className="text-sierra-teal font-semibold text-lg block mb-4">
          Ingresa el nombre de tu proyecto *
        </Label>
        <Input
          id="project-name"
          type="text"
          placeholder="Ej: Análisis Q4 2024, Proyecto Expansión, etc..."
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="text-center text-xl py-6 focus:ring-sierra-teal focus:border-sierra-teal border-2 bg-white/50 backdrop-blur-sm"
          autoFocus
          disabled={disabled}
        />
      </div>

      <Button
        onClick={onNext}
        size="lg"
        className="sierra-gradient hover:opacity-90 transition-all duration-300 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        disabled={!projectName.trim() || disabled}
      >
        Continuar
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      {!projectName.trim() && (
        <p className="text-sierra-gray/70 text-sm mt-4">
          * Campo obligatorio para continuar
        </p>
      )}
    </div>
  );
};

export default ProjectNameStep;
