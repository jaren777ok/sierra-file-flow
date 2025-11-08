
import { supabase } from '@/integrations/supabase/client';
import { PROCESSING_CONSTANTS } from '@/constants/processing';
import { createFormData, extractDownloadUrl, calculateTotalFiles } from '@/utils/processingUtils';
import { ProcessingFormData } from '@/types/processing';

export class ProcessingService {
  static async sendProcessingRequest(data: ProcessingFormData): Promise<string> {
    const formData = createFormData(
      data.projectTitle,
      data.files,
      data.userId,
      data.requestId,
      data.projectFiles,
      data.companyAnalysis
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos para respuesta inicial
    
    try {
      const response = await fetch('https://jbunbmphadxmzjokwgkw.supabase.co/functions/v1/proxy-processing-upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ [${data.requestId}] Procesamiento iniciado:`, result);
      
      // Now returns requestId instead of URL
      if (!result.requestId) {
        throw new Error('No se recibió ID de procesamiento');
      }
      
      return result.requestId;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Error al iniciar el procesamiento. Por favor, intenta nuevamente.');
      }
      
      throw fetchError;
    }
  }

  static async checkStatus(requestId: string): Promise<{
    status: 'processing' | 'completed' | 'error' | 'timeout' | 'not_found';
    progress: number;
    resultUrl?: string;
    errorMessage?: string;
  }> {
    try {
      const response = await fetch('https://jbunbmphadxmzjokwgkw.supabase.co/functions/v1/check-processing-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        throw new Error(`Error consultando status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error checking status:', error);
      throw error;
    }
  }

  static async saveJobToDatabase(
    requestId: string,
    projectTitle: string,
    totalFiles: number,
    userId: string,
    status: 'completed' | 'timeout' | 'error',
    resultUrl?: string,
    errorMessage?: string
  ): Promise<void> {
    await supabase.from('processing_jobs').insert({
      request_id: requestId,
      project_title: projectTitle,
      total_files: totalFiles,
      user_id: userId,
      status,
      progress: status === 'completed' ? 100 : 0,
      result_url: resultUrl,
      error_message: errorMessage,
      completed_at: new Date().toISOString()
    });
  }
}
