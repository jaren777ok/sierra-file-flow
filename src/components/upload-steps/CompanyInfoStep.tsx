import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Upload, X, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ACCEPTED_FILE_TYPES_STRING, ACCEPTED_FILE_NAMES, isValidFileType } from '@/constants/fileTypes';

interface CompanyInfoStepProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onNext: () => void;
  onPrev: () => void;
  disabled?: boolean;
}

const CompanyInfoStep = ({ files, onFilesChange, onNext, onPrev, disabled = false }: CompanyInfoStepProps) => {
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Validar tipos de archivos
    const invalidFiles = droppedFiles.filter(file => !isValidFileType(file));
    if (invalidFiles.length > 0) {
      toast({
        title: "Tipo de archivo no permitido",
        description: `Solo se permiten archivos ${ACCEPTED_FILE_NAMES}`,
        variant: "destructive",
      });
      return;
    }
    
    const newFiles = [...files, ...droppedFiles].slice(0, 10);
    
    if (droppedFiles.length + files.length > 10) {
      toast({
        title: "Límite excedido",
        description: "Máximo 10 archivos para información de la empresa",
        variant: "destructive",
      });
    }
    
    onFilesChange(newFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validar tipos de archivos
    const invalidFiles = selectedFiles.filter(file => !isValidFileType(file));
    if (invalidFiles.length > 0) {
      toast({
        title: "Tipo de archivo no permitido",
        description: `Solo se permiten archivos ${ACCEPTED_FILE_NAMES}`,
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }
    
    const newFiles = [...files, ...selectedFiles].slice(0, 10);
    
    if (selectedFiles.length + files.length > 10) {
      toast({
        title: "Límite excedido",
        description: "Máximo 10 archivos para información de la empresa",
        variant: "destructive",
      });
    }
    
    onFilesChange(newFiles);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    if (disabled) return;
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-sierra-teal/10 px-4 py-2 rounded-full mb-6">
          <Building2 className="h-5 w-5 text-sierra-teal" />
          <span className="text-sierra-teal font-medium">Información de la Empresa</span>
        </div>
        
        <h2 className="text-3xl font-bold text-sierra-teal mb-4">
          Documentos de la Empresa
        </h2>
        <p className="text-sierra-gray text-lg">
          Sube brochures, documentos informativos y preguntas extras (opcional)
        </p>
        <div className="text-sm text-sierra-teal/70 mt-2">
          {files.length}/10 archivos subidos
        </div>
        <div className="text-xs text-sierra-gray/60 mt-1">
          Formatos aceptados: {ACCEPTED_FILE_NAMES}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          disabled
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-sierra-teal/30 hover:border-sierra-teal bg-sierra-teal/5 hover:bg-sierra-teal/10 cursor-pointer'
        }`}
      >
        <Upload className="h-12 w-12 text-sierra-teal mx-auto mb-4" />
        <p className="text-sierra-teal font-medium mb-2">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="text-sierra-gray text-sm">
          Máximo 10 archivos (PDF, Word, Excel)
        </p>
        
        <input
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES_STRING}
          onChange={handleFileSelect}
          className="hidden"
          id="company-info-upload"
          disabled={disabled}
        />
        
        {!disabled && (
          <label
            htmlFor="company-info-upload"
            className="mt-4 inline-block px-6 py-2 bg-sierra-teal text-white rounded-lg cursor-pointer hover:bg-sierra-teal/80 transition-colors"
          >
            Seleccionar Archivos
          </label>
        )}
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-sierra-teal mb-3">Archivos seleccionados:</h3>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-sierra-teal/20 shadow-sm"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Building2 className="h-5 w-5 text-sierra-teal flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sierra-teal truncate">{file.name}</p>
                  <p className="text-xs text-sierra-gray">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!disabled && (
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 p-1 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
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
          className="sierra-gradient hover:opacity-90 px-6 py-3"
          disabled={disabled}
        >
          Siguiente
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CompanyInfoStep;
