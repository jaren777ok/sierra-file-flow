
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Upload, X, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Area {
  key: string;
  name: string;
  icon: string;
}

interface FileUploadStepProps {
  area: Area;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

const FileUploadStep = ({ area, files, onFilesChange, onNext, onPrev }: FileUploadStepProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles = [...files, ...droppedFiles].slice(0, 5);
    
    if (droppedFiles.length + files.length > 5) {
      toast({
        title: "Límite excedido",
        description: "Máximo 5 archivos por área. Se agregaron solo los primeros.",
        variant: "destructive",
      });
    }
    
    onFilesChange(newFiles);
  }, [files, onFilesChange, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = [...files, ...selectedFiles].slice(0, 5);
    
    if (selectedFiles.length + files.length > 5) {
      toast({
        title: "Límite excedido",
        description: "Máximo 5 archivos por área. Se agregaron solo los primeros.",
        variant: "destructive",
      });
    }
    
    onFilesChange(newFiles);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{area.icon}</div>
        <h2 className="text-3xl font-bold text-sierra-teal mb-2">
          Área {area.name}
        </h2>
        <p className="text-sierra-gray text-lg">
          Sube los archivos relacionados con {area.name.toLowerCase()} (máximo 5 archivos)
        </p>
        <div className="text-sm text-sierra-teal/70 mt-2">
          {files.length}/5 archivos subidos
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 mb-6 ${
          isDragOver 
            ? 'border-sierra-teal bg-sierra-teal/10 scale-105' 
            : 'border-sierra-teal/30 hover:border-sierra-teal hover:bg-sierra-teal/5'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <Upload className="mx-auto h-16 w-16 text-sierra-teal mb-4" />
        <h3 className="text-xl font-semibold text-sierra-teal mb-2">
          Arrastra tus archivos aquí
        </h3>
        <p className="text-sierra-gray mb-6">
          O haz clic para seleccionar desde tu dispositivo
        </p>
        
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id={`file-upload-${area.key}`}
          disabled={files.length >= 5}
        />
        
        <Button
          asChild
          className="sierra-gradient hover:opacity-90 transition-opacity"
          disabled={files.length >= 5}
        >
          <label htmlFor={`file-upload-${area.key}`} className="cursor-pointer">
            {files.length >= 5 ? 'Límite alcanzado' : 'Seleccionar Archivos'}
          </label>
        </Button>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-sierra-teal/20">
          <h4 className="font-semibold text-sierra-teal mb-4">Archivos subidos:</h4>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-sierra-teal" />
                  <div>
                    <p className="font-medium text-sierra-teal">{file.name}</p>
                    <p className="text-sm text-sierra-gray">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrev}
          className="px-6 py-3 border-sierra-teal text-sierra-teal hover:bg-sierra-teal hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        
        <Button
          onClick={onNext}
          className="sierra-gradient hover:opacity-90 px-6 py-3"
        >
          {files.length === 0 ? 'Saltar' : 'Siguiente'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FileUploadStep;
