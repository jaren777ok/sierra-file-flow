import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Upload, X, FolderPlus, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ACCEPTED_FILE_TYPES_STRING, ACCEPTED_FILE_NAMES, isValidFileType } from '@/constants/fileTypes';

interface CustomArea {
  id: string;
  name: string;
  icon: string;
  files: File[];
}

interface CustomAreaUploadStepProps {
  area: CustomArea;
  onNameChange: (id: string, name: string) => void;
  onFilesChange: (id: string, files: File[]) => void;
  onRemoveArea: (id: string) => void;
  onAddAnotherArea: () => void;
  onNext: () => void;
  onPrev: () => void;
  disabled?: boolean;
  showAddAnother?: boolean;
}

const CustomAreaUploadStep = ({ 
  area, 
  onNameChange, 
  onFilesChange, 
  onRemoveArea,
  onAddAnotherArea,
  onNext, 
  onPrev, 
  disabled = false,
  showAddAnother = true
}: CustomAreaUploadStepProps) => {
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(area.name);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    const invalidFiles = droppedFiles.filter(file => !isValidFileType(file));
    if (invalidFiles.length > 0) {
      toast({
        title: "Tipo de archivo no permitido",
        description: `Solo se permiten archivos ${ACCEPTED_FILE_NAMES}`,
        variant: "destructive",
      });
      return;
    }
    
    const newFiles = [...area.files, ...droppedFiles].slice(0, 10);
    
    if (droppedFiles.length + area.files.length > 10) {
      toast({
        title: "Límite excedido",
        description: "Máximo 10 archivos por área",
        variant: "destructive",
      });
    }
    
    onFilesChange(area.id, newFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const selectedFiles = Array.from(e.target.files || []);
    
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
    
    const newFiles = [...area.files, ...selectedFiles].slice(0, 10);
    
    if (selectedFiles.length + area.files.length > 10) {
      toast({
        title: "Límite excedido",
        description: "Máximo 10 archivos por área",
        variant: "destructive",
      });
    }
    
    onFilesChange(area.id, newFiles);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    if (disabled) return;
    const newFiles = area.files.filter((_, i) => i !== index);
    onFilesChange(area.id, newFiles);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      onNameChange(area.id, tempName.trim());
      setIsEditingName(false);
    } else {
      toast({
        title: "Nombre requerido",
        description: "El área debe tener un nombre",
        variant: "destructive",
      });
    }
  };

  const handleRemoveArea = () => {
    if (confirm(`¿Estás seguro de eliminar el área "${area.name}"?`)) {
      onRemoveArea(area.id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-6">
          <FolderPlus className="h-5 w-5 text-purple-600" />
          <span className="text-purple-600 font-medium">Área Personalizada</span>
        </div>
        
        {/* Editable Area Name */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="text-2xl font-bold text-center border-purple-300 focus:border-purple-500"
                placeholder="Nombre del área"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <Button
                size="sm"
                onClick={handleSaveName}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Guardar
              </Button>
            </div>
          ) : (
            <>
              <h2 
                className="text-3xl font-bold text-purple-600 cursor-pointer hover:text-purple-700 transition-colors"
                onClick={() => !disabled && setIsEditingName(true)}
                title="Clic para editar"
              >
                {area.icon} {area.name}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveArea}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        
        <p className="text-gray-600 text-lg">
          Sube documentos para esta área personalizada
        </p>
        <div className="text-sm text-purple-600/70 mt-2">
          {area.files.length}/10 archivos subidos
        </div>
        <div className="text-xs text-gray-500 mt-1">
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
            : 'border-purple-300 hover:border-purple-500 bg-purple-50 hover:bg-purple-100 cursor-pointer'
        }`}
      >
        <Upload className="h-12 w-12 text-purple-600 mx-auto mb-4" />
        <p className="text-purple-600 font-medium mb-2">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="text-gray-600 text-sm">
          Máximo 10 archivos (PDF, Word, Excel)
        </p>
        
        <input
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES_STRING}
          onChange={handleFileSelect}
          className="hidden"
          id={`custom-area-upload-${area.id}`}
          disabled={disabled}
        />
        
        {!disabled && (
          <label
            htmlFor={`custom-area-upload-${area.id}`}
            className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
          >
            Seleccionar Archivos
          </label>
        )}
      </div>

      {/* Files List */}
      {area.files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-purple-600 mb-3">Archivos seleccionados:</h3>
          {area.files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 shadow-sm"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FolderPlus className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-600 truncate">{file.name}</p>
                  <p className="text-xs text-gray-600">
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
          className="px-6 py-3 border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600"
          disabled={disabled}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        
        <div className="flex gap-3">
          {showAddAnother && !disabled && (
            <Button
              variant="outline"
              onClick={onAddAnotherArea}
              className="px-6 py-3 border-purple-500 text-purple-600 hover:bg-purple-100 hover:border-purple-600 hover:text-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Otra Área
            </Button>
          )}
          
          <Button
            onClick={onNext}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 text-white"
            disabled={disabled}
          >
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomAreaUploadStep;
