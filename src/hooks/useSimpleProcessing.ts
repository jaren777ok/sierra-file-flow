
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessingStatus {
  status: 'idle' | 'sending' | 'processing' | 'completed' | 'timeout' | 'error';
  progress: number;
  message: string;
  timeElapsed: number;
  showConfetti?: boolean;
  requestId?: string;
}

const useSimpleProcessing = () => {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0,
    message: '',
    timeElapsed: 0,
    showConfetti: false
  });
  
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const { toast } = useToast();
  const { saveProcessedFile } = useSavedFiles();

  // Nueva URL de webhook de producción
  const WEBHOOK_URL = 'https://primary-production-f0d1.up.railway.app/webhook/sierra';
  const MAX_TIMEOUT = 900000; // 15 minutos en milisegundos

  const updateElapsedTime = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setProcessingStatus(prev => ({
        ...prev,
        timeElapsed: elapsed,
        progress: Math.min(Math.floor((elapsed / 900) * 100), 95) // Progreso basado en tiempo hasta 95%
      }));
    }
  }, []);

  // Generar Request ID simple
  const generateRequestId = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SIERRA-${timestamp}-${random}`;
  };

  // Helper function to calculate total files with proper typing
  const calculateTotalFiles = (areaFiles: Record<string, File[]> | undefined, files: File[]): number => {
    if (areaFiles) {
      return Object.values(areaFiles).reduce((acc: number, fileArray: File[]) => {
        const count = Array.isArray(fileArray) ? fileArray.length : 0;
        return acc + count;
      }, 0);
    }
    return files.length;
  };

  // Función principal de procesamiento simplificada
  const startProcessing = useCallback(async (projectTitle: string, files: File[], areaFiles?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const requestId = generateRequestId();

      console.log(`🚀 [${requestId}] Iniciando procesamiento SIMPLIFICADO:`, { 
        projectTitle, 
        fileCount: files.length, 
        webhookUrl: WEBHOOK_URL
      });
      
      setProcessingStatus({
        status: 'sending',
        progress: 5,
        message: 'Preparando archivos para envío...',
        timeElapsed: 0,
        showConfetti: false,
        requestId
      });
      setResultUrl(null);
      
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(updateElapsedTime, 1000);
      
      // Crear FormData
      const formData = new FormData();
      formData.append('request_id', requestId);
      formData.append('project_title', projectTitle);
      formData.append('user_id', user.id);
      
      if (areaFiles) {
        // Formato organizado por área
        const areas = ['comercial', 'operaciones', 'pricing', 'administracion'];
        let totalFiles = 0;
        const activeAreas: string[] = [];
        
        areas.forEach(area => {
          const files = areaFiles[area] || [];
          if (files.length > 0) {
            activeAreas.push(area);
            totalFiles += files.length;
            formData.append(`${area}_count`, files.length.toString());
            
            files.forEach((file: File, index: number) => {
              formData.append(`${area}_${index}`, file);
              formData.append(`${area}_${index}_name`, file.name);
            });
          }
        });
        
        formData.append('total_files', totalFiles.toString());
        formData.append('active_areas', activeAreas.join(','));
      } else {
        // Formato legacy
        formData.append('total_files', files.length.toString());
        files.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });
      }
      
      formData.append('timestamp', Date.now().toString());

      // Actualizar UI
      setProcessingStatus(prev => ({
        ...prev,
        status: 'processing',
        progress: 10,
        message: 'Enviando archivos y esperando respuesta del servidor (máximo 15 minutos)...',
        requestId
      }));

      console.log(`📡 [${requestId}] Enviando a webhook con timeout de 15 minutos...`);
      
      // Fetch con timeout de 15 minutos - ESTRATEGIA SIMPLIFICADA
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), MAX_TIMEOUT);
      
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Procesar respuesta JSON
        const result = await response.json();
        console.log(`✅ [${requestId}] Respuesta del webhook:`, result);
        
        // Extraer URL de resultado
        let downloadUrl = null;
        if (Array.isArray(result) && result.length > 0 && result[0].EXITO) {
          downloadUrl = result[0].EXITO;
        } else if (result.EXITO) {
          downloadUrl = result.EXITO;
        } else if (result.url) {
          downloadUrl = result.url;
        }
        
        if (downloadUrl) {
          // ÉXITO - Mostrar resultado inmediatamente
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          setProcessingStatus(prev => ({
            ...prev,
            status: 'completed',
            progress: 100,
            message: '¡Procesamiento completado exitosamente!',
            showConfetti: true,
            requestId
          }));
          
          setResultUrl(downloadUrl);
          
          // Guardar archivo procesado
          await saveProcessedFile(projectTitle, 'Multi-área', downloadUrl);
          
          // Guardar resultado en BD para historial - CORRIGIENDO TIPOS
          const totalFilesCount = calculateTotalFiles(areaFiles, files);
          
          await supabase.from('processing_jobs').insert({
            request_id: requestId,
            project_title: projectTitle,
            total_files: totalFilesCount,
            user_id: user.id,
            status: 'completed',
            progress: 100,
            result_url: downloadUrl,
            completed_at: new Date().toISOString()
          });
          
          toast({
            title: "¡Procesamiento Completado!",
            description: `Tu archivo ha sido procesado correctamente. ID: ${requestId}`,
          });
          
        } else {
          throw new Error('No se encontró URL de descarga en la respuesta del servidor');
        }
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          // Timeout de 15 minutos
          console.log(`⏰ [${requestId}] Timeout de 15 minutos alcanzado`);
          
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          setProcessingStatus(prev => ({
            ...prev,
            status: 'timeout',
            message: 'El servidor no respondió dentro del tiempo límite de 15 minutos. Puedes intentar nuevamente.',
            showConfetti: false
          }));
          
          toast({
            title: "Tiempo Límite Alcanzado",
            description: `El procesamiento excedió los 15 minutos. (ID: ${requestId})`,
            variant: "destructive",
          });
          
          // Guardar timeout en BD
          const totalFilesCount = calculateTotalFiles(areaFiles, files);
            
          await supabase.from('processing_jobs').insert({
            request_id: requestId,
            project_title: projectTitle,
            total_files: totalFilesCount,
            user_id: user.id,
            status: 'timeout',
            error_message: 'Timeout de 15 minutos alcanzado',
            completed_at: new Date().toISOString()
          });
          
        } else {
          throw fetchError;
        }
      }
      
    } catch (error) {
      console.error(`❌ Error durante el procesamiento:`, error);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido durante el procesamiento';
      const requestId = processingStatus.requestId || 'unknown';
      
      setProcessingStatus(prev => ({
        ...prev,
        status: 'error',
        progress: 0,
        message: errorMessage,
        showConfetti: false,
        requestId
      }));
      
      toast({
        title: "Error en el Procesamiento",
        description: `${errorMessage} (ID: ${requestId})`,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [updateElapsedTime, toast, saveProcessedFile, processingStatus.requestId]);

  const resetProcessing = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setProcessingStatus({
      status: 'idle',
      progress: 0,
      message: '',
      timeElapsed: 0,
      showConfetti: false
    });
    setResultUrl(null);
    startTimeRef.current = 0;
  }, []);

  const hideConfetti = useCallback(() => {
    setProcessingStatus(prev => ({
      ...prev,
      showConfetti: false
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    processingStatus,
    resultUrl,
    startProcessing,
    resetProcessing,
    hideConfetti
  };
};

export default useSimpleProcessing;
