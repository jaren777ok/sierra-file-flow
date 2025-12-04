import React, { useState, useCallback } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isValidFileType, ACCEPTED_FILE_NAMES } from '@/constants/fileTypes';
import { AreaFiles } from '@/types/processing';

interface Area {
  key: string;
  name: string;
  icon: string;
}

interface CustomArea {
  id: string;
  name: string;
  icon: string;
  files: File[];
}

interface AreaDropTargetsProps {
  areas: Area[];
  areaFiles: AreaFiles;
  customAreas: CustomArea[];
  onAreaFilesChange: (areaKey: string, files: File[]) => void;
  onCustomAreaFilesChange: (areaId: string, files: File[]) => void;
  onAddCustomArea: () => void;
  currentAreaKey?: string;
  disabled?: boolean;
}

const AreaDropTargets = ({
  areas,
  areaFiles,
  customAreas,
  onAreaFilesChange,
  onCustomAreaFilesChange,
  onAddCustomArea,
  currentAreaKey,
  disabled = false
}: AreaDropTargetsProps) => {
  const [dragOverArea, setDragOverArea] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent, areaKey: string, isCustom: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverArea(null);
    
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

    if (isCustom) {
      const customArea = customAreas.find(a => a.id === areaKey);
      if (customArea) {
        const currentFiles = customArea.files || [];
        const newFiles = [...currentFiles, ...droppedFiles].slice(0, 10);
        
        if (droppedFiles.length + currentFiles.length > 10) {
          toast({
            title: "Límite excedido",
            description: "Máximo 10 archivos por área.",
            variant: "destructive",
          });
        }
        
        onCustomAreaFilesChange(areaKey, newFiles);
        toast({
          title: "Archivos agregados",
          description: `${Math.min(droppedFiles.length, 10 - currentFiles.length)} archivo(s) agregados a ${customArea.name}`,
        });
      }
    } else {
      const currentFiles = (areaFiles as unknown as Record<string, File[]>)[areaKey] || [];
      const newFiles = [...currentFiles, ...droppedFiles].slice(0, 10);
      
      if (droppedFiles.length + currentFiles.length > 10) {
        toast({
          title: "Límite excedido",
          description: "Máximo 10 archivos por área.",
          variant: "destructive",
        });
      }
      
      onAreaFilesChange(areaKey, newFiles);
      const areaName = areas.find(a => a.key === areaKey)?.name || areaKey;
      toast({
        title: "Archivos agregados",
        description: `${Math.min(droppedFiles.length, 10 - currentFiles.length)} archivo(s) agregados a ${areaName}`,
      });
    }
  }, [areas, areaFiles, customAreas, onAreaFilesChange, onCustomAreaFilesChange, toast, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent, areaKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragOverArea(areaKey);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverArea(null);
  }, []);

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-xl border border-sierra-teal/20">
      <div className="text-xs font-semibold text-sierra-teal text-center mb-1 px-2">
        Arrastra aquí
      </div>
      
      {/* Áreas fijas */}
      {areas.map((area) => {
        const files = (areaFiles as unknown as Record<string, File[]>)[area.key] || [];
        const isOver = dragOverArea === area.key;
        const isCurrent = currentAreaKey === area.key;
        
        return (
          <div
            key={area.key}
            className={`
              relative flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer
              transition-all duration-200 min-w-[80px]
              ${isOver 
                ? 'bg-sierra-teal scale-110 shadow-lg' 
                : isCurrent 
                  ? 'bg-sierra-teal/20 ring-2 ring-sierra-teal' 
                  : 'bg-sierra-mint/50 hover:bg-sierra-teal/10'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onDrop={(e) => handleDrop(e, area.key, false)}
            onDragOver={(e) => handleDragOver(e, area.key)}
            onDragLeave={handleDragLeave}
          >
            <span className={`text-2xl ${isOver ? 'scale-125' : ''} transition-transform`}>
              {area.icon}
            </span>
            <span className={`text-[10px] font-medium mt-1 ${isOver ? 'text-white' : 'text-sierra-teal'}`}>
              {area.name}
            </span>
            {files.length > 0 && (
              <div className={`
                absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                ${isOver ? 'bg-white text-sierra-teal' : 'bg-sierra-teal text-white'}
              `}>
                {files.length}
              </div>
            )}
          </div>
        );
      })}

      {/* Separador */}
      {customAreas.length > 0 && (
        <div className="border-t border-sierra-teal/20 my-1" />
      )}

      {/* Áreas personalizadas */}
      {customAreas.map((area) => {
        const isOver = dragOverArea === area.id;
        
        return (
          <div
            key={area.id}
            className={`
              relative flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer
              transition-all duration-200 min-w-[80px]
              ${isOver 
                ? 'bg-purple-500 scale-110 shadow-lg' 
                : 'bg-purple-100/50 hover:bg-purple-200/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onDrop={(e) => handleDrop(e, area.id, true)}
            onDragOver={(e) => handleDragOver(e, area.id)}
            onDragLeave={handleDragLeave}
          >
            <FolderOpen className={`w-5 h-5 ${isOver ? 'text-white' : 'text-purple-600'}`} />
            <span className={`text-[10px] font-medium mt-1 truncate max-w-[70px] ${isOver ? 'text-white' : 'text-purple-600'}`}>
              {area.name || 'Nueva'}
            </span>
            {area.files.length > 0 && (
              <div className={`
                absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                ${isOver ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'}
              `}>
                {area.files.length}
              </div>
            )}
          </div>
        );
      })}

      {/* Botón agregar área */}
      <button
        onClick={onAddCustomArea}
        disabled={disabled}
        className={`
          flex flex-col items-center justify-center p-3 rounded-xl
          border-2 border-dashed border-sierra-teal/30 
          hover:border-sierra-teal hover:bg-sierra-teal/5
          transition-all duration-200 min-w-[80px]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Plus className="w-5 h-5 text-sierra-teal/60" />
        <span className="text-[10px] text-sierra-teal/60 mt-1">Agregar</span>
      </button>
    </div>
  );
};

export default AreaDropTargets;
