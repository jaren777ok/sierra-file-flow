
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
      data.areaFiles
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROCESSING_CONSTANTS.MAX_TIMEOUT);
    
    try {
      const response = await fetch(PROCESSING_CONSTANTS.WEBHOOK_URL, {
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
      
      const result = await response.json();
      console.log(`✅ [${data.requestId}] Respuesta del webhook:`, result);
      
      const downloadUrl = extractDownloadUrl(result);
      if (!downloadUrl) {
        throw new Error('No se encontró URL de descarga en la respuesta del servidor');
      }
      
      return downloadUrl;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      
      throw fetchError;
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
