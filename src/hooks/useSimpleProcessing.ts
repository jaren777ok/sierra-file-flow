
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

  const updateElapsedTime = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setProcessingStatus(prev => ({
        ...prev,
        timeElapsed: elapsed
      }));
    }
  }, []);

  const startProcessing = useCallback(async (projectTitle: string, files: File[]) => {
    console.log('🚀 Starting processing with:', { projectTitle, fileCount: files.length });
    
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
      });
      
      console.log('📤 Sending files to webhook...');
      
      // Update status to sending
      setProcessingStatus(prev => ({
        ...prev,
        status: 'sending',
        progress: 10,
        message: 'Enviando archivos al sistema IA...'
      }));
      
      // Send to webhook
      const response = await fetch('https://hook.us2.make.com/l41wt3v6p9w2qb2n5d0p7xb1n7b6rkpe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.text();
      console.log('✅ Webhook response received:', result);
      
      // Update to processing
      setProcessingStatus(prev => ({
        ...prev,
        status: 'processing',
        progress: 25,
        message: 'Procesando con IA... Esto puede tomar hasta 15 minutos.'
      }));
      
      // Check if response contains a Google Drive URL
      if (result.includes('drive.google.com')) {
        console.log('🎉 Processing completed successfully!');
        
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
        
        setResultUrl(result.trim());
        
        // Save to processed files
        await saveProcessedFile(projectTitle, 'Multi-área', result.trim());
        
        toast({
          title: "¡Procesamiento Completado!",
          description: "Tu archivo ha sido procesado y guardado correctamente.",
        });
        
        return result.trim();
      } else {
        throw new Error('La respuesta no contiene una URL válida de Google Drive');
      }
      
    } catch (error) {
      console.error('❌ Processing error:', error);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setProcessingStatus(prev => ({
        ...prev,
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Error desconocido',
        showConfetti: false
      }));
      
      toast({
        title: "Error en el Procesamiento",
        description: "Hubo un problema al procesar los archivos. Intenta nuevamente.",
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
      console.log('⏰ Processing timeout reached (15 minutes)');
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setProcessingStatus(prev => ({
        ...prev,
        status: 'timeout',
        message: 'Tiempo límite alcanzado. Puedes iniciar un nuevo procesamiento.',
        showConfetti: false
      }));
      
      toast({
        title: "Tiempo Límite Alcanzado",
        description: "El procesamiento ha excedido los 15 minutos. Puedes iniciar un nuevo trabajo.",
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
