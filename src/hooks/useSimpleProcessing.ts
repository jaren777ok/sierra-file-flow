import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSavedFiles } from '@/hooks/useSavedFiles';

export interface ProcessingStatus {
  status: 'idle' | 'sending' | 'processing' | 'completed' | 'timeout' | 'error';
  progress: number;
  message: string;
  timeElapsed: number;
  showConfetti?: boolean;
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

  const sendToWebhook = async (formData: FormData, retryCount = 0): Promise<string> => {
    try {
      console.log(`🚀 Enviando a webhook (intento ${retryCount + 1}/${MAX_RETRIES + 1}):`, WEBHOOK_URL);
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        // Agregar headers para mejor compatibilidad
        headers: {
          'Accept': '*/*',
        },
        // Configurar timeout explícito si es necesario
        signal: AbortSignal.timeout(30000) // 30 segundos para el envío inicial
      });
      
      console.log('📡 Status de respuesta:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.text();
      console.log('✅ Respuesta del webhook recibida:', result.substring(0, 200) + '...');
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error en intento ${retryCount + 1}:`, error);
      
      // Determinar si es un error que vale la pena reintentar
      const isRetryableError = 
        error instanceof TypeError && error.message.includes('fetch') || // Network errors
        error instanceof Error && error.message.includes('CORS') ||
        error instanceof Error && error.message.includes('timeout') ||
        (error instanceof Error && error.message.includes('HTTP') && 
         (error.message.includes('502') || error.message.includes('503') || error.message.includes('504')));
      
      if (isRetryableError && retryCount < MAX_RETRIES) {
        console.log(`🔄 Reintentando en ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
        return sendToWebhook(formData, retryCount + 1);
      }
      
      // Si no es reintentar o se agotaron los intentos, lanzar error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Error de conexión: No se puede conectar al servidor. Verifica tu conexión a internet y que el webhook esté funcionando.');
      } else if (error instanceof Error && error.message.includes('CORS')) {
        throw new Error('Error CORS: El servidor no permite el acceso desde este dominio.');
      } else {
        throw error;
      }
    }
  };

  const startProcessing = useCallback(async (projectTitle: string, files: File[]) => {
    console.log('🚀 Iniciando procesamiento con:', { projectTitle, fileCount: files.length, webhookUrl: WEBHOOK_URL });
    
    // Reset state
    setProcessingStatus({
      status: 'sending',
      progress: 0,
      message: 'Preparando archivos para envío...',
      timeElapsed: 0,
      showConfetti: false
    });
    setResultUrl(null);
    
    // Start timer
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(updateElapsedTime, 1000);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('projectTitle', projectTitle);
      
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
        console.log(`📎 Archivo ${index}: ${file.name} (${file.size} bytes)`);
      });
      
      // Update status to sending
      setProcessingStatus(prev => ({
        ...prev,
        status: 'sending',
        progress: 10,
        message: 'Enviando archivos al webhook de Railway...'
      }));
      
      // Send to webhook with retry logic
      const result = await sendToWebhook(formData);
      
      // Update to processing
      setProcessingStatus(prev => ({
        ...prev,
        status: 'processing',
        progress: 25,
        message: 'Archivos enviados correctamente. Procesando con IA... Esto puede tomar hasta 15 minutos.'
      }));
      
      // Check if response contains a Google Drive URL or process result appropriately
      const trimmedResult = result.trim();
      
      // Verificar diferentes formatos de respuesta posibles
      let driveUrl = '';
      
      if (trimmedResult.includes('drive.google.com')) {
        // Si contiene directamente la URL de Google Drive
        driveUrl = trimmedResult;
      } else {
        try {
          // Intentar parsear como JSON si no es una URL directa
          const jsonResult = JSON.parse(trimmedResult);
          if (jsonResult.url && jsonResult.url.includes('drive.google.com')) {
            driveUrl = jsonResult.url;
          } else if (jsonResult.drive_url) {
            driveUrl = jsonResult.drive_url;
          } else {
            throw new Error('El webhook no retornó una URL de Google Drive válida en el formato esperado');
          }
        } catch (parseError) {
          // Si no es JSON válido, tratar como URL directa
          if (trimmedResult.startsWith('http')) {
            driveUrl = trimmedResult;
          } else {
            throw new Error(`Respuesta del webhook no reconocida: ${trimmedResult.substring(0, 100)}...`);
          }
        }
      }
      
      if (driveUrl) {
        console.log('🎉 ¡Procesamiento completado exitosamente!');
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Update status to completed with confetti
        setProcessingStatus(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          message: '¡Procesamiento completado exitosamente!',
          showConfetti: true
        }));
        
        setResultUrl(driveUrl);
        
        // Save to processed files
        await saveProcessedFile(projectTitle, 'Multi-área', driveUrl);
        
        toast({
          title: "¡Procesamiento Completado!",
          description: "Tu archivo ha sido procesado y guardado correctamente.",
        });
        
        return driveUrl;
      } else {
        throw new Error('El webhook no retornó una URL válida de Google Drive');
      }
      
    } catch (error) {
      console.error('❌ Error durante el procesamiento:', error);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido durante el procesamiento';
      
      setProcessingStatus(prev => ({
        ...prev,
        status: 'error',
        progress: 0,
        message: errorMessage,
        showConfetti: false
      }));
      
      toast({
        title: "Error en el Procesamiento",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [updateElapsedTime, toast, saveProcessedFile]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Check for timeout (15 minutes)
  useEffect(() => {
    if (processingStatus.timeElapsed >= 900 && processingStatus.status === 'processing') {
      console.log('⏰ Tiempo límite de procesamiento alcanzado (15 minutos)');
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setProcessingStatus(prev => ({
        ...prev,
        status: 'timeout',
        message: 'Tiempo límite alcanzado. El procesamiento puede continuar en segundo plano. Puedes iniciar un nuevo trabajo si es necesario.',
        showConfetti: false
      }));
      
      toast({
        title: "Tiempo Límite Alcanzado",
        description: "El procesamiento ha excedido los 15 minutos. El trabajo puede continuar procesándose en segundo plano.",
        variant: "destructive",
      });
    }
  }, [processingStatus.timeElapsed, processingStatus.status, toast]);

  return {
    processingStatus,
    resultUrl,
    startProcessing,
    resetProcessing,
    hideConfetti
  };
};

export default useSimpleProcessing;
