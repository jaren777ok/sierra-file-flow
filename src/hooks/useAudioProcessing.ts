import { useState, useEffect, useRef } from 'react';
import { AudioProcessingStatus } from '@/types/audio';
import { AudioProcessingService } from '@/services/audioProcessingService';
import { toast } from '@/hooks/use-toast';

export const useAudioProcessing = () => {
  const [processingStatus, setProcessingStatus] = useState<AudioProcessingStatus>({
    status: 'idle',
    progress: 0,
    message: '',
    timeElapsed: 0,
  });

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setProcessingStatus(prev => ({
        ...prev,
        timeElapsed: elapsed,
        progress: Math.min(90, 20 + (elapsed / 60) * 10), // Progreso gradual
      }));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startProcessing = async (audioFile: File) => {
    console.log('🎵 Iniciando procesamiento de audio:', audioFile.name);
    setOriginalFileName(audioFile.name);

    // Validar archivo
    const validation = AudioProcessingService.validateAudioFile(audioFile);
    if (!validation.valid) {
      toast({
        title: 'Error de validación',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    // Estado inicial: uploading
    setProcessingStatus({
      status: 'uploading',
      progress: 10,
      message: 'Enviando audio al servidor...',
      timeElapsed: 0,
    });

    startTimer();

    try {
      // Simular un pequeño delay para mostrar el estado de "uploading"
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Cambiar a processing
      setProcessingStatus(prev => ({
        ...prev,
        status: 'processing',
        progress: 20,
        message: 'Analizando audio con IA...',
      }));

      // Enviar audio al webhook
      const resultUrl = await AudioProcessingService.sendAudioToWebhook(audioFile);

      stopTimer();

      // Completado
      setProcessingStatus({
        status: 'completed',
        progress: 100,
        message: '¡Transcripción completada!',
        timeElapsed: Math.floor((Date.now() - startTimeRef.current) / 1000),
      });

      setDownloadUrl(resultUrl);

      toast({
        title: '¡Éxito!',
        description: 'Tu audio ha sido transcrito correctamente',
      });

    } catch (error: any) {
      stopTimer();
      
      console.error('❌ Error en procesamiento:', error);

      setProcessingStatus({
        status: 'error',
        progress: 0,
        message: error.message || 'Error al procesar el audio',
        timeElapsed: Math.floor((Date.now() - startTimeRef.current) / 1000),
      });

      toast({
        title: 'Error al procesar audio',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    }
  };

  const resetProcessing = () => {
    stopTimer();
    setProcessingStatus({
      status: 'idle',
      progress: 0,
      message: '',
      timeElapsed: 0,
    });
    setDownloadUrl(null);
    setOriginalFileName('');
  };

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  return {
    processingStatus,
    downloadUrl,
    originalFileName,
    startProcessing,
    resetProcessing,
  };
};
