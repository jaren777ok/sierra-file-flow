
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadStatus {
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'ready-for-download' | 'error';
  progress: number;
  message?: string;
  processedFile?: Blob;
  downloadUrl?: string;
  originalFileName?: string;
}

export const useFileUpload = (areaName: string) => {
  const [files, setFiles] = useState<FileUploadStatus[]>([]);
  const { toast } = useToast();

  const WEBHOOK_URL = 'https://primary-production-f0d1.up.railway.app/webhook-test/sierra';
  const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutos

  const uploadFiles = async (filesToUpload: File[]) => {
    if (filesToUpload.length !== 2) {
      toast({
        title: "Error",
        description: `Debes subir exactamente 2 archivos para ${areaName}`,
        variant: "destructive",
      });
      return;
    }

    // Limpiar archivos anteriores
    setFiles([]);

    // Crear estados iniciales para ambos archivos
    const initialStates: FileUploadStatus[] = filesToUpload.map(file => ({
      file,
      status: 'uploading',
      progress: 0,
      originalFileName: file.name,
    }));

    setFiles(initialStates);

    try {
      // Crear FormData con ambos archivos
      const formData = new FormData();
      filesToUpload.forEach((file, index) => {
        formData.append(`file${index + 1}`, file);
        formData.append(`filename${index + 1}`, file.name);
      });
      
      formData.append('area', areaName);
      formData.append('fileCount', '2');
      formData.append('timestamp', new Date().toISOString());

      // Actualizar progreso a 30%
      setFiles(prev => prev.map(f => ({ ...f, progress: 30 })));

      // Actualizar progreso a 50% y cambiar estado
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        progress: 50, 
        status: 'processing' as const 
      })));

      console.log(`Enviando archivos de ${areaName} a webhook:`, WEBHOOK_URL);

      const uploadPromise = fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La operación tardó más de 15 minutos')), TIMEOUT_DURATION);
      });

      const response = await Promise.race([uploadPromise, timeoutPromise]) as Response;

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          // Respuesta JSON - workflow iniciado
          const jsonResponse = await response.json();
          console.log('Respuesta JSON recibida:', jsonResponse);
          
          setFiles(prev => prev.map(f => ({ 
            ...f, 
            progress: 75, 
            status: 'processing' as const,
            message: 'Procesando archivos con IA...'
          })));
          
          setTimeout(() => {
            setFiles(prev => prev.map(f => ({ 
              ...f, 
              progress: 100, 
              status: 'completed' as const,
              message: 'Procesamiento completado. Esperando archivo procesado...'
            })));
          }, 2000);
          
        } else {
          // Respuesta binaria - archivo procesado recibido
          const processedBlob = await response.blob();
          const downloadUrl = URL.createObjectURL(processedBlob);
          
          const contentDisposition = response.headers.get('content-disposition');
          let processedFileName = `${areaName}_procesado.zip`;
          
          if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (fileNameMatch) {
              processedFileName = fileNameMatch[1].replace(/['"]/g, '');
            }
          }

          // Actualizar solo el primer archivo con la descarga (representa el resultado combinado)
          setFiles(prev => prev.map((f, index) => 
            index === 0 ? { 
              ...f, 
              progress: 100, 
              status: 'ready-for-download' as const,
              message: 'Archivos procesados y listos para descargar',
              processedFile: processedBlob,
              downloadUrl: downloadUrl
            } : {
              ...f,
              progress: 100,
              status: 'completed' as const,
              message: 'Incluido en archivo procesado'
            }
          ));

          toast({
            title: "¡Archivos Procesados!",
            description: `Los archivos de ${areaName} han sido procesados y están listos para descargar.`,
          });
        }
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }

    } catch (error) {
      console.error('Error al subir archivos:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'error' as const,
        message: errorMessage
      })));

      toast({
        title: "Error",
        description: `Error al procesar archivos de ${areaName}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const downloadProcessedFile = (fileStatus: FileUploadStatus) => {
    if (fileStatus.downloadUrl && fileStatus.originalFileName) {
      const link = document.createElement('a');
      link.href = fileStatus.downloadUrl;
      link.download = `${areaName}_procesado.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Descarga Iniciada",
        description: `Los archivos procesados de ${areaName} se están descargando.`,
      });
    }
  };

  const removeFiles = () => {
    // Limpiar URLs de objeto para evitar memory leaks
    files.forEach(fileStatus => {
      if (fileStatus.downloadUrl) {
        URL.revokeObjectURL(fileStatus.downloadUrl);
      }
    });
    
    setFiles([]);
  };

  return {
    files,
    uploadFiles,
    downloadProcessedFile,
    removeFiles
  };
};
