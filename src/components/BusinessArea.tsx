
import React, { useCallback, useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle, X, Clock, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/hooks/useFileUpload';
import ProjectNameInput from './ProjectNameInput';

interface BusinessAreaProps {
  areaName: string;
  areaTitle: string;
  description?: string;
}

const BusinessArea = ({ areaName, areaTitle, description }: BusinessAreaProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const { files, uploadFiles, downloadProcessedFile, removeFiles } = useFileUpload(areaName);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 2) {
      droppedFiles.splice(2); // Mantener solo los primeros 2
    }
    setSelectedFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 2) {
      selected.splice(2); // Mantener solo los primeros 2
    }
    setSelectedFiles(selected);
    e.target.value = '';
  };

  const handleUpload = () => {
    if (selectedFiles.length === 2 && projectTitle.trim()) {
      uploadFiles(selectedFiles, projectTitle);
      setSelectedFiles([]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Clock className="h-5 w-5 text-sierra-teal animate-pulse" />;
      case 'completed':
      case 'ready-for-download':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Subiendo archivos...';
      case 'processing':
        return 'Procesando con IA...';
      case 'completed':
        return 'Procesamiento completado';
      case 'ready-for-download':
        return 'Listo para descargar';
      case 'error':
        return 'Error en procesamiento';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'text-sierra-teal';
      case 'completed':
      case 'ready-for-download':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-sierra-gray';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-sierra-teal/5 to-sierra-teal/10 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sierra-teal/10 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-sierra-teal" />
            </div>
            <div>
              <CardTitle className="text-sierra-teal text-lg">{areaTitle}</CardTitle>
              {description && (
                <p className="text-sierra-gray text-sm mt-1">{description}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ProjectNameInput
            value={projectTitle}
            onChange={setProjectTitle}
            areaName={areaName}
          />
          
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              isDragOver 
                ? 'border-sierra-teal bg-sierra-teal/10 scale-[1.02] shadow-lg' 
                : 'border-sierra-teal/30 hover:border-sierra-teal hover:bg-sierra-teal/5 hover:shadow-md'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${
                isDragOver ? 'bg-sierra-teal text-white' : 'bg-sierra-teal/10 text-sierra-teal'
              }`}>
                <Upload className="h-8 w-8" />
              </div>
              
              <h3 className="text-xl font-bold text-sierra-teal mb-2">
                Sube exactamente 2 archivos
              </h3>
              <p className="text-sierra-gray mb-6 max-w-md">
                Arrastra tus archivos aquí o haz clic para seleccionar. 
                La IA procesará automáticamente tus documentos.
              </p>
              
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id={`file-upload-${areaName}`}
                accept="*/*"
              />
              
              <Button
                asChild
                variant="outline"
                className="mb-6 border-sierra-teal text-sierra-teal hover:bg-sierra-teal hover:text-white transition-all duration-200"
              >
                <label htmlFor={`file-upload-${areaName}`} className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Archivos ({selectedFiles.length}/2)
                </label>
              </Button>

              {selectedFiles.length > 0 && (
                <div className="w-full max-w-md space-y-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-sierra-teal/5 p-3 rounded-lg border border-sierra-teal/20">
                      <div className="flex items-center gap-3">
                        <File className="h-5 w-5 text-sierra-teal" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sierra-teal truncate">{file.name}</p>
                          <p className="text-xs text-sierra-gray">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    onClick={handleUpload}
                    disabled={selectedFiles.length !== 2 || !projectTitle.trim()}
                    className="w-full sierra-gradient hover:opacity-90 transition-all duration-200 font-semibold h-12"
                  >
                    {selectedFiles.length === 2 && projectTitle.trim() ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Procesar con IA
                      </>
                    ) : (
                      `Necesitas ${2 - selectedFiles.length} archivo(s) más y nombre del proyecto`
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sierra-teal/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-sierra-teal" />
                </div>
                <h3 className="text-xl font-bold text-sierra-teal">
                  Estado del Procesamiento IA
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFiles}
                className="text-sierra-gray hover:text-red-500 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-5">
              {files.map((fileStatus, index) => (
                <div key={index} className="bg-gradient-to-r from-stone-50 to-stone-100 p-5 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sierra-teal/10 rounded-lg flex items-center justify-center shrink-0">
                      <File className="h-6 w-6 text-sierra-teal" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sierra-teal truncate text-lg">
                            {fileStatus.file.name}
                          </p>
                          <p className="text-sm text-sierra-gray">
                            {(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          {getStatusIcon(fileStatus.status)}
                          {fileStatus.status === 'ready-for-download' && (
                            <Button
                              onClick={() => downloadProcessedFile(fileStatus)}
                              size="sm"
                              className="sierra-gradient hover:opacity-90"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Descargar
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Progress 
                            value={fileStatus.progress} 
                            className="flex-1 h-3"
                          />
                          <span className="text-sm font-mono text-sierra-teal ml-3 min-w-0">
                            {fileStatus.progress}%
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${getStatusColor(fileStatus.status)}`}>
                            {getStatusText(fileStatus.status)}
                          </p>
                          {fileStatus.message && (
                            <p className={`text-sm ${getStatusColor(fileStatus.status)} text-right`}>
                              {fileStatus.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessArea;
