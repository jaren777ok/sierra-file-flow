
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { useProcessingPersistence } from '@/hooks/useProcessingPersistence';
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

export const useMultiStepUpload = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [areaFiles, setAreaFiles] = useState<AreaFiles>({
    comercial: [],
    operaciones: [],
    pricing: [],
    administracion: []
  });
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0,
    timeElapsed: 0,
    showConfetti: false
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const { saveProcessedFile, fetchSavedFiles } = useSavedFiles();
  const { 
    activeJob, 
    isLoading: isLoadingActiveJob,
    startJobTracking,
    completeJob, 
    clearActiveJob,
    getTrackingData,
    isJobWithinTimeLimit
  } = useProcessingPersistence();

  const isRecovering = isLoadingActiveJob;
  const WEBHOOK_URL = 'https://primary-production-f0d1.up.railway.app/webhook-test/sierra';
  const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutos

  const areas = useMemo(() => [
    { key: 'comercial' as keyof AreaFiles, name: 'Comercial', icon: '💼' },
    { key: 'operaciones' as keyof AreaFiles, name: 'Operaciones', icon: '⚙️' },
    { key: 'pricing' as keyof AreaFiles, name: 'Pricing', icon: '💰' },
    { key: 'administracion' as keyof AreaFiles, name: 'Administración', icon: '📊' }
  ], []);

  const updateAreaFiles = useCallback((area: keyof AreaFiles, files: File[]) => {
    if (files.length > 5) {
      toast({
        title: "Límite excedido",
        description: "Máximo 5 archivos por área",
        variant: "destructive",
      });
      return;
    }
    
    setAreaFiles(prev => ({
      ...prev,
      [area]: files
    }));
  }, [toast]);

  const nextStep = useCallback(() => {
    if (currentStep === 0 && !projectName.trim()) {
      toast({
        title: "Campo requerido",
        description: "Ingresa el nombre del proyecto",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 6));
  }, [currentStep, projectName, toast]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const getTotalFiles = useCallback(() => {
    return Object.values(areaFiles).reduce((total, files) => total + files.length, 0);
  }, [areaFiles]);

  const processAllFiles = useCallback(async () => {
    const totalFiles = getTotalFiles();
    
    if (totalFiles === 0) {
      toast({
        title: "No hay archivos",
        description: "Sube al menos un archivo para procesar",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar autenticado para procesar archivos",
        variant: "destructive",
      });
      return;
    }

    // Verificar si ya hay un trabajo activo
    if (activeJob && activeJob.status === 'processing') {
      toast({
        title: "Trabajo en progreso",
        description: "Ya tienes un trabajo en procesamiento. Espera a que termine.",
        variant: "destructive",
      });
      return;
    }

    // Verificar si hay datos de tracking locales válidos
    const trackingData = getTrackingData();
    if (trackingData && trackingData.userId === user.id && isJobWithinTimeLimit(trackingData.sendTimestamp)) {
      toast({
        title: "Trabajo en progreso",
        description: "Ya tienes un trabajo siendo procesado. Espera a que termine.",
        variant: "destructive",
      });
      return;
    }

    // Generar request_id único
    const requestId = `req_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sendTimestamp = Date.now();

    // Iniciar tracking local
    startJobTracking(projectName, requestId, user.id);

    // Ir al paso de procesamiento
    setCurrentStep(6);

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
          message: 'El procesamiento excedió el tiempo límite de 15 minutos. Puedes iniciar un nuevo trabajo.',
          requestId,
          showConfetti: false
        });
        clearActiveJob();
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
        // Verificar si la respuesta contiene la URL del archivo procesado
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const jsonResponse = await response.json();
          console.log('🎉 Respuesta JSON recibida:', jsonResponse);
          
          // Manejar la nueva estructura de respuesta [{"EXITO": "url"}]
          let resultUrl = null;
          
          if (Array.isArray(jsonResponse) && jsonResponse.length > 0 && jsonResponse[0].EXITO) {
            resultUrl = jsonResponse[0].EXITO;
            console.log('✅ URL del archivo procesado extraída de EXITO:', resultUrl);
          } else if (jsonResponse.driveUrl || jsonResponse.drive_url || jsonResponse.resultUrl || jsonResponse.result_url) {
            // Mantener compatibilidad con estructuras anteriores
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
              
              // Actualizar lista de archivos guardados
              await fetchSavedFiles();
              console.log('🔄 Lista de archivos guardados actualizada');
            } catch (error) {
              console.error('💥 Error guardando archivo:', error);
              // Intentar guardar de nuevo
              setTimeout(async () => {
                try {
                  await saveProcessedFile(projectName, 'multi-area', resultUrl);
                  await fetchSavedFiles();
                  console.log('✅ Archivo guardado en segundo intento');
                } catch (retryError) {
                  console.error('💥 Error en segundo intento de guardado:', retryError);
                }
              }, 1000);
            }
            
            // Completar trabajo en la base de datos
            await completeJob(requestId, resultUrl);
            
            // Mostrar éxito con confeti
            const finalElapsed = Math.floor((Date.now() - sendTimestamp) / 1000);
            setProcessingStatus({
              status: 'completed',
              progress: 100,
              timeElapsed: finalElapsed,
              message: '¡Informe IA generado exitosamente!',
              resultUrl: resultUrl,
              requestId,
              showConfetti: true // 🎊 ACTIVAR CONFETI
            });

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
          
          // En este caso, no podemos guardarlo en Drive automáticamente
          // Pero podemos permitir descarga directa
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

          toast({
            title: "🎉 ¡Archivo Procesado!",
            description: "Tu archivo ha sido procesado y está listo para descargar.",
          });
        }
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }

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

      toast({
        title: "💥 Error",
        description: `Error al procesar archivos: ${errorMessage}`,
        variant: "destructive",
      });
    }
  }, [areaFiles, projectName, areas, getTotalFiles, activeJob, user, startJobTracking, getTrackingData, isJobWithinTimeLimit, saveProcessedFile, fetchSavedFiles, completeJob, clearActiveJob, toast]);

  const resetFlow = useCallback(() => {
    setCurrentStep(0);
    setProjectName('');
    setAreaFiles({
      comercial: [],
      operaciones: [],
      pricing: [],
      administracion: []
    });
    setProcessingStatus({
      status: 'idle',
      progress: 0,
      timeElapsed: 0,
      showConfetti: false
    });
    clearActiveJob();
  }, [clearActiveJob]);

  const startNewJob = useCallback(() => {
    const savedProjectName = projectName || activeJob?.project_title || '';
    
    resetFlow();
    
    if (savedProjectName) {
      setProjectName(savedProjectName);
    }
    
    toast({
      title: "🚀 Nuevo trabajo iniciado",
      description: "Puedes subir nuevos archivos y comenzar el procesamiento.",
    });
  }, [resetFlow, projectName, activeJob?.project_title, toast]);

  const hideConfetti = useCallback(() => {
    setProcessingStatus(prev => ({
      ...prev,
      showConfetti: false
    }));
  }, []);

  return {
    currentStep,
    projectName,
    setProjectName,
    areaFiles,
    updateAreaFiles,
    processingStatus,
    areas,
    nextStep,
    prevStep,
    processAllFiles,
    resetFlow,
    startNewJob,
    getTotalFiles,
    activeJob,
    isRecovering,
    setCurrentStep,
    hideConfetti
  };
};
