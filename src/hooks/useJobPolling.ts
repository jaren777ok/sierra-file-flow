
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProcessingPersistence } from '@/hooks/useProcessingPersistence';
import { useToast } from '@/hooks/use-toast';
import { useSavedFiles } from '@/hooks/useSavedFiles';

export const useJobPolling = (jobId?: string) => {
  const { completeJob, checkActiveJob } = useProcessingPersistence();
  const { saveProcessedFile } = useSavedFiles();
  const { toast } = useToast();
  const pollingRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!jobId) return;

    // Polling cada 30 segundos para verificar si el webhook ha actualizado el trabajo
    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('processing_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('Error polling job:', error);
          return;
        }

        if (data && data.status !== 'processing') {
          // El trabajo se completó
          if (data.status === 'completed') {
            if (data.result_url) {
              // Guardar en archivos procesados
              await saveProcessedFile(data.project_title, 'multi-area', data.result_url);
              toast({
                title: "¡Procesamiento Completado!",
                description: "Tu informe IA está listo para descargar.",
              });
            }
          } else if (data.status === 'error') {
            toast({
              title: "Error en Procesamiento",
              description: data.error_message || "Error desconocido",
              variant: "destructive",
            });
          }

          // Limpiar polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }

          // Actualizar estado local
          await checkActiveJob();
        }
      } catch (error) {
        console.error('Error in job polling:', error);
      }
    }, 30000); // 30 segundos

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [jobId, completeJob, checkActiveJob, saveProcessedFile, toast]);

  return null;
};
