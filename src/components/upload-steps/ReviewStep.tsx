
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, FileText } from 'lucide-react';
import { AreaFiles } from '@/hooks/useMultiStepUpload';
import { ProcessingJob } from '@/hooks/useProcessingPersistence';

interface Area {
  key: keyof AreaFiles;
  name: string;
  icon: string;
}

interface ReviewStepProps {
  projectName: string;
  areaFiles: AreaFiles;
  areas: Area[];
  totalFiles: number;
  onNext: () => void;
  onPrev: () => void;
  disabled?: boolean;
  activeJob?: ProcessingJob | null;
}

const ReviewStep = ({ projectName, areaFiles, areas, totalFiles, onNext, onPrev, disabled = false }: ReviewStepProps) => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-sierra-teal/10 px-4 py-2 rounded-full mb-6">
          <Sparkles className="h-5 w-5 text-sierra-teal animate-pulse" />
          <span className="text-sierra-teal font-medium">Revisión Final</span>
        </div>
        
        <h2 className="text-3xl font-bold text-sierra-teal mb-4">
          Resumen del Proyecto
        </h2>
        <p className="text-sierra-gray text-lg">
          Revisa los archivos antes de generar tu informe IA
        </p>
      </div>

      {/* Project Summary */}
      <div className="bg-gradient-to-r from-sierra-teal/10 to-sierra-teal/5 rounded-2xl p-6 mb-8 border border-sierra-teal/20">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-6 w-6 text-sierra-teal" />
          <h3 className="text-xl font-semibold text-sierra-teal">Proyecto: {projectName}</h3>
        </div>
        <div className="text-sierra-gray">
          <p className="text-lg">Total de archivos: <span className="font-semibold text-sierra-teal">{totalFiles}</span></p>
        </div>
      </div>

      {/* Areas Summary */}
      <div className="space-y-4 mb-8">
        {areas.map((area) => {
          const files = areaFiles[area.key];
          return (
            <div
              key={area.key}
              className={`p-4 rounded-xl border transition-all ${
                files.length > 0 
                  ? 'bg-white border-sierra-teal/20 shadow-sm' 
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{area.icon}</span>
                  <div>
                    <h4 className="font-semibold text-sierra-teal">{area.name}</h4>
                    <p className="text-sm text-sierra-gray">
                      {files.length > 0 ? `${files.length} archivo${files.length > 1 ? 's' : ''}` : 'Sin archivos'}
                    </p>
                  </div>
                </div>
                
                {files.length > 0 && (
                  <div className="text-right">
                    <div className="w-8 h-8 rounded-full bg-sierra-teal text-white flex items-center justify-center text-sm font-bold">
                      {files.length}
                    </div>
                  </div>
                )}
              </div>
              
              {files.length > 0 && (
                <div className="mt-3 space-y-1">
                  {files.map((file, index) => (
                    <div key={index} className="text-xs text-sierra-gray bg-sierra-teal/5 px-2 py-1 rounded">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning if no files */}
      {totalFiles === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <p className="text-yellow-800">
            ⚠️ No has subido ningún archivo. Puedes continuar pero el informe estará vacío.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrev}
          className="px-6 py-3 border-sierra-teal text-sierra-teal hover:bg-sierra-teal hover:text-white"
          disabled={disabled}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        
        <Button
          onClick={onNext}
          className="sierra-gradient hover:opacity-90 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          disabled={disabled}
        >
          <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
          Generar Informe IA
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
