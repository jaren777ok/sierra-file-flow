
import React, { useCallback, useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle, X, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/hooks/useFileUpload';

interface BusinessAreaProps {
  areaName: string;
  areaTitle: string;
  description?: string;
}

const BusinessArea = ({ areaName, areaTitle, description }: BusinessAreaProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
    if (selectedFiles.length === 2) {
      uploadFiles(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Clock className="h-5 w-5 text-sierra-brown animate-pulse" />;
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
        return 'Subiendo...';
      case 'processing':
        return 'Procesando con IA...';
      case 'completed':
        return 'Procesamiento completado';
      case 'ready-for-download':
        return 'Listo para descargar';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="mountain-shadow">
        <CardHeader>
          <CardTitle className="text-sierra-brown">{areaTitle}</CardTitle>
          {description && (
            <p className="text-sierra-gray text-sm">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragOver 
                ? 'border-sierra-brown bg-sierra-brown/5 scale-105' 
                : 'border-gray-300 hover:border-sierra-brown hover:bg-sierra-brown/5'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <Upload className="mx-auto h-12 w-12 text-sierra-brown mb-4" />
            <h3 className="text-lg font-semibold text-sierra-brown mb-2">
              Sube exactamente 2 archivos
            </h3>
            <p className="text-sierra-gray mb-4">
              Arrastra tus archivos aquí o haz clic para seleccionar
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
              className="mb-4"
            >
              <label htmlFor={`file-upload-${areaName}`} className="cursor-pointer">
                Seleccionar Archivos ({selectedFiles.length}/2)
              </label>
            </Button>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
                
                <Button
                  onClick={handleUpload}
                  disabled={selectedFiles.length !== 2}
                  className="sierra-gradient hover:opacity-90 transition-opacity mt-4"
                >
                  Procesar Archivos {selectedFiles.length === 2 ? '✓' : `(${selectedFiles.length}/2)`}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card className="mountain-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-sierra-brown">
                Estado del Procesamiento
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFiles}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {files.map((fileStatus, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <File className="h-8 w-8 text-sierra-brown flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileStatus.file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(fileStatus.status)}
                        {fileStatus.status === 'ready-for-download' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadProcessedFile(fileStatus)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Progress 
                        value={fileStatus.progress} 
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-gray-500 font-mono">
                        {fileStatus.progress}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB • {getStatusText(fileStatus.status)}
                      </p>
                      {fileStatus.message && (
                        <p className={`text-xs ${
                          fileStatus.status === 'error' ? 'text-red-600' : 
                          fileStatus.status === 'ready-for-download' ? 'text-green-600' :
                          'text-sierra-brown'
                        }`}>
                          {fileStatus.message}
                        </p>
                      )}
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
