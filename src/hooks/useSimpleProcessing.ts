
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { useProcessingPersistence } from '@/hooks/useProcessingPersistence';
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
  const { createProcessingJob, updateJobProgress, completeJob, markJobAsTimeout } = useProcessingPersistence();

  // Nueva URL del webhook de Railway
  const WEBHOOK_URL = 'https://primary-production-f0d1.up.railway.app/webhook-test/sierra';
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 segundos

  const updateElapsedTime = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setProcessingStatus(prev => ({
        ...prev,
        timeElapsed: elapsed
      }));
    }
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const sendToWebhook = async (formData: FormData, requestId: string, retryCount = 0): Promise<string> => {
    try {
      console.log(`🚀 [${requestId}] Enviando a webhook (intento ${retryCount + 1}/${MAX_RETRIES + 1}):`, WEBHOOK_URL);
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': '*/*',
        },
        signal: AbortSignal.timeout(30000)
      });
      
      console.log(`📡 [${requestId}] Status de respuesta:`, response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.text();
      console.log(`✅ [${requestId}] Respuesta del webhook recibida:`, result.substring(0, 200) + '...');
      
      return result;
      
    } catch (error) {
      console.error(`❌ [${requestId}] Error en intento ${retryCount + 1}:`, error);
      
      const isRetryableError = 
        error instanceof TypeError && error.message.includes('fetch') || 
        error instanceof Error && error.message.includes('CORS') ||
        error instanceof Error && error.message.includes('timeout') ||
        (error instanceof Error && error.message.includes('HTTP') && 
         (error.message.includes('502') || error.message.includes('503') || error.message.includes('504')));
      
      if (isRetryableError && retryCount < MAX_RETRIES) {
        console.log(`🔄 [${requestId}] Reintentando en ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
        return sendToWebhook(formData, requestId, retryCount + 1);
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Error de conexión: No se puede conectar al servidor. Verifica tu conexión a internet y que el webhook esté funcionando.');
      } else if (error instanceof Error && error.message.includes('CORS')) {
        throw new Error('Error CORS: El servidor no permite el acceso desde este dominio.');
      } else {
        throw error;
      }
    }
  };

  const createFormDataWithAreas = (requestId: string, projectTitle: string, areaFiles: any) => {
    const formData = new FormData();
    
    const areas = ['comercial', 'operaciones', 'pricing', 'administracion'];
    const activeAreas: string[] = [];
    let totalFiles = 0;
    
    console.log(`📊 [${requestId}] Creando FormData organizado por áreas:`, areaFiles);
    
    // Agregar Request ID como campo directo y simple
    formData.append('request_id', requestId);
    formData.append('project_title', projectTitle);
    
    areas.forEach(area => {
      const files = areaFiles[area] || [];
      if (files.length > 0) {
        activeAreas.push(area);
        totalFiles += files.length;
        formData.append(`${area}_count`, files.length.toString());
        
        files.forEach((file: File, index: number) => {
          formData.append(`${area}_${index}`, file);
          formData.append(`${area}_${index}_name`, file.name);
          console.log(`📎 [${requestId}] ${area} [${index}]: ${file.name} (${file.size} bytes)`);
        });
      }
    });
    
    // Agregar información adicional como campos simples
    formData.append('total_files', totalFiles.toString());
    formData.append('active_areas', activeAreas.join(','));
    formData.append('timestamp', Date.now().toString());
    
    console.log(`🗂️ [${requestId}] Áreas activas:`, activeAreas);
    console.log(`📤 [${requestId}] FormData preparado con Request ID simple: ${requestId}`);
    
    return formData;
  };

  const startProcessing = useCallback(async (projectTitle: string, files: File[], areaFiles?: any) => {
    try {
      // Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Crear trabajo en processing_jobs y generar Request ID único
      const requestId = await createProcessingJob(
        projectTitle, 
        files.length, 
        user.id
      );

      console.log(`🚀 [${requestId}] Iniciando procesamiento con:`, { 
        projectTitle, 
        fileCount: files.length, 
        webhookUrl: WEBHOOK_URL,
        requestId,
        userId: user.id
      });
      
      setProcessingStatus({
        status: 'sending',
        progress: 0,
        message: 'Preparando archivos para envío...',
        timeElapsed: 0,
        showConfetti: false,
        requestId
      });
      setResultUrl(null);
      
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(updateElapsedTime, 1000);
      
      let formData: FormData;
      
      // Si tenemos areaFiles, usamos el nuevo formato organizado
      if (areaFiles) {
        formData = createFormDataWithAreas(requestId, projectTitle, areaFiles);
        
        setProcessingStatus(prev => ({
          ...prev,
          message: `Enviando archivos organizados por área al webhook...`,
          requestId
        }));
      } else {
        // Formato legacy para compatibilidad
        formData = new FormData();
        formData.append('request_id', requestId);
        formData.append('project_title', projectTitle);
        formData.append('total_files', files.length.toString());
        formData.append('timestamp', Date.now().toString());
        
        files.forEach((file, index) => {
          formData.append(`file${index}`, file);
          console.log(`📎 [${requestId}] Archivo ${index}: ${file.name} (${file.size} bytes)`);
        });
      }
      
      // Actualizar estado a 'processing' en la BD
      await updateJobProgress(requestId, 10);
      
      setProcessingStatus(prev => ({
        ...prev,
        status: 'sending',
        progress: 10,
        message: 'Enviando archivos al webhook de Railway...',
        requestId
      }));
      
      const result = await sendToWebhook(formData, requestId);
      
      // Actualizar progreso en BD
      await updateJobProgress(requestId, 25);
      
      setProcessingStatus(prev => ({
        ...prev,
        status: 'processing',
        progress: 25,
        message: 'Archivos enviados correctamente. Procesando con IA... Esto puede tomar hasta 15 minutos.',
        requestId
      }));
      
      const trimmedResult = result.trim();
      let driveUrl = '';
      
      if (trimmedResult.includes('drive.google.com')) {
        driveUrl = trimmedResult;
      } else {
        try {
          const jsonResult = JSON.parse(trimmedResult);
          if (jsonResult.url && jsonResult.url.includes('drive.google.com')) {
            driveUrl = jsonResult.url;
          } else if (jsonResult.drive_url) {
            driveUrl = jsonResult.drive_url;
          } else {
            throw new Error('El webhook no retornó una URL de Google Drive válida en el formato esperado');
          }
        } catch (parseError) {
          if (trimmedResult.startsWith('http')) {
            driveUrl = trimmedResult;
          } else {
            throw new Error(`Respuesta del webhook no reconocida: ${trimmedResult.substring(0, 100)}...`);
          }
        }
      }
      
      if (driveUrl) {
        console.log(`🎉 [${requestId}] ¡Procesamiento completado exitosamente!`);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Completar trabajo en BD
        await completeJob(requestId, driveUrl);
        
        setProcessingStatus(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          message: '¡Procesamiento completado exitosamente!',
          showConfetti: true,
          requestId
        }));
        
        setResultUrl(driveUrl);
        
        await saveProcessedFile(projectTitle, 'Multi-área', driveUrl);
        
        toast({
          title: "¡Procesamiento Completado!",
          description: `Tu archivo ha sido procesado correctamente. ID: ${requestId}`,
        });
        
        return driveUrl;
      } else {
        throw new Error('El webhook no retornó una URL válida de Google Drive');
      }
      
    } catch (error) {
      console.error(`❌ Error durante el procesamiento:`, error);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido durante el procesamiento';
      const requestId = processingStatus.requestId || 'unknown';
      
      // Marcar trabajo como error en BD
      if (requestId !== 'unknown') {
        await completeJob(requestId, undefined, errorMessage);
      }
      
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
  }, [updateElapsedTime, toast, saveProcessedFile, createProcessingJob, updateJobProgress, completeJob]);

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

  useEffect(() => {
    if (processingStatus.timeElapsed >= 900 && processingStatus.status === 'processing') {
      const requestId = processingStatus.requestId || 'unknown';
      console.log(`⏰ [${requestId}] Tiempo límite de procesamiento alcanzado (15 minutos)`);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Marcar como timeout en BD
      if (requestId !== 'unknown') {
        markJobAsTimeout(requestId);
      }
      
      setProcessingStatus(prev => ({
        ...prev,
        status: 'timeout',
        message: 'Tiempo límite alcanzado. El procesamiento puede continuar en segundo plano. Puedes iniciar un nuevo trabajo si es necesario.',
        showConfetti: false
      }));
      
      toast({
        title: "Tiempo Límite Alcanzado",
        description: `El procesamiento ha excedido los 15 minutos. (ID: ${requestId})`,
        variant: "destructive",
      });
    }
  }, [processingStatus.timeElapsed, processingStatus.status, processingStatus.requestId, toast, markJobAsTimeout]);

  return {
    processingStatus,
    resultUrl,
    startProcessing,
    resetProcessing,
    hideConfetti
  };
};

export default useSimpleProcessing;
