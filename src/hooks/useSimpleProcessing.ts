
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { useAuth } from '@/contexts/AuthContext';

export interface AreaFiles {
  comercial: File[];
  operaciones: File[];
  pricing: File[];
  administracion: File[];
}

export interface ProcessingStatus {
  status: 'idle' | 'sending' | 'processing' | 'completed' | 'error' | 'timeout';
  progress: number;
  timeElapsed: number;
  message?: string;
  resultUrl?: string;
  requestId?: string;
  sendTimestamp?: number;
  showConfetti?: boolean;
}

// Interfaz para tracking temporal
interface TempJobTracking {
  requestId: string;
  sendTimestamp: number;
  projectName: string;
  userId: string;
}

export const useSimpleProcessing = () => {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0,
    timeElapsed: 0,
    showConfetti: false
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const { saveProcessedFile, fetchSavedFiles } = useSavedFiles();
  
  const WEBHOOK_URL = 'https://primary-production-f0d1.up.railway.app/webhook-test/sierra';
  const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutos
  const TEMP_TRACKING_KEY = 'temp_processing_job';

  // Funciones de tracking temporal
  const getTempTracking = (): TempJobTracking | null => {
    try {
      const data = localStorage.getItem(TEMP_TRACKING_KEY);
      if (!data) return null;
      
      const tracking: TempJobTracking = JSON.parse(data);
      
      // Auto-limpiar si pasaron más de 15 minutos
      const elapsed = Date.now() - tracking.sendTimestamp;
      if (elapsed > TIMEOUT_DURATION) {
        clearTempTracking();
        return null;
      }
      
      return tracking;
    } catch {
      clearTempTracking();
      return null;
    }
  };

  const setTempTracking = (data: TempJobTracking) => {
    localStorage.setItem(TEMP_TRACKING_KEY, JSON.stringify(data));
  };

  const clearTempTracking = () => {
    localStorage.removeItem(TEMP_TRACKING_KEY);
  };

  // Verificar si hay un trabajo temporal válido
  const hasActiveJob = useCallback((): boolean => {
    if (!user) return false;
    
    const tracking = getTempTracking();
    if (!tracking || tracking.userId !== user.id) {
      return false;
    }
    
    return true;
  }, [user]);

  // Obtener información del trabajo temporal
  const getActiveJobInfo = useCallback((): TempJobTracking | null => {
    if (!user) return null;
    
    const tracking = getTempTracking();
    if (!tracking || tracking.userId !== user.id) {
      return null;
    }
    
    return tracking;
  }, [user]);

  // Proceso principal de archivos
  const processFiles = useCallback(async (
    projectName: string, 
    areaFiles: AreaFiles, 
    areas: Array<{ key: keyof AreaFiles; name: string; icon: string }>
  ) => {
    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar autenticado para procesar archivos",
        variant: "destructive",
      });
      return false;
    }

    // Verificar si ya hay un trabajo activo
    if (hasActiveJob()) {
      const activeInfo = getActiveJobInfo();
      toast({
        title: "Trabajo en progreso",
        description: `Ya tienes un trabajo procesando: "${activeInfo?.projectName}". Espera a que termine o usa "Forzar Limpieza".`,
        variant: "destructive",
      });
      return false;
    }

    const totalFiles = Object.values(areaFiles).reduce((total, files) => total + files.length, 0);
    
    if (totalFiles === 0) {
      toast({
        title: "No hay archivos",
        description: "Sube al menos un archivo para procesar",
        variant: "destructive",
      });
      return false;
    }

    // Generar request_id único
    const requestId = `req_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sendTimestamp = Date.now();

    // Guardar tracking temporal
    setTempTracking({
      requestId,
      sendTimestamp,
      projectName,
      userId: user.id
    });

    // Configurar timer en tiempo real
    const timerInterval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - sendTimestamp) / 1000);
      setProcessingStatus(prev => ({
        ...prev,
        timeElapsed: elapsedSeconds
      }));
    }, 1000);

    setProcessingStatus({
      status: 'sending',
      progress: 10,
      timeElapsed: 0,
      message: 'Preparando archivos para envío...',
      requestId,
      sendTimestamp,
      showConfetti: false
    });

    try {
      const formData = new FormData();
      let fileIndex = 0;

      // Agregar archivos con nombres específicos del área
      Object.entries(areaFiles).forEach(([areaKey, files]) => {
        const areaName = areas.find(a => a.key === areaKey)?.name || areaKey;
        files.forEach((file, index) => {
          const fileName = `${areaName}_${index + 1}.${file.name.split('.').pop()}`;
          formData.append(fileName, file);
          fileIndex++;
        });
      });

      // Agregar metadatos
      formData.append('area', 'multi-area');
      formData.append('fileCount', fileIndex.toString());
      formData.append('timestamp', new Date().toISOString());
      formData.append('titulo', projectName.trim());
      formData.append('request_id', requestId);
      formData.append('user_id', user.id);
      formData.append('send_timestamp', sendTimestamp.toString());

      setProcessingStatus(prev => ({
        ...prev,
        status: 'processing',
        progress: 25,
        message: 'Enviando archivos y esperando procesamiento de IA...'
      }));

      console.log(`📤 Enviando ${fileIndex} archivos para proyecto: ${projectName} con request_id: ${requestId}`);

      // Configurar timeout de 15 minutos
      const timeoutId = setTimeout(() => {
        clearInterval(timerInterval);
        setProcessingStatus({
          status: 'timeout',
          progress: 0,
          timeElapsed: 15 * 60,
          message: 'El procesamiento excedió el tiempo límite de 15 minutos.',
          requestId,
          showConfetti: false
        });
        clearTempTracking(); // Limpiar tracking temporal
        toast({
          title: "⏰ Tiempo límite alcanzado",
          description: "Puedes iniciar un nuevo procesamiento cuando gustes.",
        });
      }, TIMEOUT_DURATION);

      // Enviar a webhook y esperar respuesta directa
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      // Clear timeout ya que recibimos respuesta
      clearTimeout(timeoutId);
      clearInterval(timerInterval);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const jsonResponse = await response.json();
          console.log('🎉 Respuesta JSON recibida:', jsonResponse);
          
          let resultUrl = null;
          
          // Manejar estructura [{"EXITO": "url"}]
          if (Array.isArray(jsonResponse) && jsonResponse.length > 0 && jsonResponse[0].EXITO) {
            resultUrl = jsonResponse[0].EXITO;
            console.log('✅ URL del archivo procesado extraída de EXITO:', resultUrl);
          } else if (jsonResponse.driveUrl || jsonResponse.drive_url || jsonResponse.resultUrl || jsonResponse.result_url) {
            resultUrl = jsonResponse.driveUrl || jsonResponse.drive_url || jsonResponse.resultUrl || jsonResponse.result_url;
            console.log('✅ URL del archivo procesado extraída (formato anterior):', resultUrl);
          }
          
          if (resultUrl) {
            console.log('✅ URL del archivo procesado confirmada:', resultUrl);
            
            // Guardar archivo en la base de datos
            try {
              console.log('💾 Guardando archivo procesado en la base de datos...');
              await saveProcessedFile(projectName, 'multi-area', resultUrl);
              console.log('✅ Archivo guardado exitosamente');
              
              await fetchSavedFiles();
              console.log('🔄 Lista de archivos guardados actualizada');
            } catch (error) {
              console.error('💥 Error guardando archivo:', error);
            }
            
            // Completar con éxito
            const finalElapsed = Math.floor((Date.now() - sendTimestamp) / 1000);
            setProcessingStatus({
              status: 'completed',
              progress: 100,
              timeElapsed: finalElapsed,
              message: '¡Informe IA generado exitosamente!',
              resultUrl: resultUrl,
              requestId,
              showConfetti: true
            });

            // Limpiar tracking temporal al completar
            clearTempTracking();

            toast({
              title: "🎉 ¡Informe IA Completado!",
              description: "Tu informe ha sido procesado y guardado exitosamente.",
            });
            
          } else {
            throw new Error('La respuesta no contiene una URL válida del archivo procesado');
          }
        } else {
          // Respuesta binaria - archivo procesado recibido directamente
          const processedBlob = await response.blob();
          const downloadUrl = URL.createObjectURL(processedBlob);
          
          console.log('✅ Archivo binario procesado recibido');
          
          const finalElapsed = Math.floor((Date.now() - sendTimestamp) / 1000);
          setProcessingStatus({
            status: 'completed',
            progress: 100,
            timeElapsed: finalElapsed,
            message: '¡Archivo procesado y listo para descargar!',
            resultUrl: downloadUrl,
            requestId,
            showConfetti: true
          });

          // Limpiar tracking temporal
          clearTempTracking();

          toast({
            title: "🎉 ¡Archivo Procesado!",
            description: "Tu archivo ha sido procesado y está listo para descargar.",
          });
        }
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      return true;

    } catch (error) {
      clearInterval(timerInterval);
      console.error('💥 Error al procesar archivos:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setProcessingStatus({
        status: 'error',
        progress: 0,
        timeElapsed: 0,
        message: errorMessage,
        requestId,
        showConfetti: false
      });

      // Limpiar tracking temporal en caso de error
      clearTempTracking();

      toast({
        title: "💥 Error",
        description: `Error al procesar archivos: ${errorMessage}`,
        variant: "destructive",
      });

      return false;
    }
  }, [user, hasActiveJob, getActiveJobInfo, saveProcessedFile, fetchSavedFiles, toast]);

  // Forzar limpieza para casos de emergencia
  const forceCleanup = useCallback(() => {
    clearTempTracking();
    setProcessingStatus({
      status: 'idle',
      progress: 0,
      timeElapsed: 0,
      showConfetti: false
    });
    
    toast({
      title: "🧹 Sistema Limpiado",
      description: "Se ha forzado la limpieza. Puedes iniciar un nuevo trabajo.",
    });
  }, [toast]);

  // Reset completo
  const resetAll = useCallback(() => {
    clearTempTracking();
    setProcessingStatus({
      status: 'idle',
      progress: 0,
      timeElapsed: 0,
      showConfetti: false
    });
  }, []);

  // Ocultar confeti
  const hideConfetti = useCallback(() => {
    setProcessingStatus(prev => ({
      ...prev,
      showConfetti: false
    }));
  }, []);

  return {
    processingStatus,
    processFiles,
    hasActiveJob,
    getActiveJobInfo,
    forceCleanup,
    resetAll,
    hideConfetti
  };
};
