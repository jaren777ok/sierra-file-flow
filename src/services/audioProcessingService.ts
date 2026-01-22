import { AUDIO_CONFIG } from '@/constants/audio';
import { AudioWebhookResponse } from '@/types/audio';

export class AudioProcessingService {
  static async sendAudioToWebhook(audioFile: File): Promise<string> {
    console.log('🎵 Enviando audio al webhook:', audioFile.name);

    const formData = new FormData();
    formData.append('audio', audioFile);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AUDIO_CONFIG.TIMEOUT);

      const response = await fetch('https://bkdbzgasphacukxjqpbh.supabase.co/functions/v1/proxy-audio-upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      const data: AudioWebhookResponse[] = await response.json();
      console.log('📥 Respuesta del webhook:', data);

      if (data && data.length > 0 && data[0].EXITO) {
        return data[0].EXITO;
      }

      throw new Error('Respuesta del servidor sin URL de descarga');
    } catch (error: any) {
      console.error('❌ Error al procesar audio:', error);

      if (error.name === 'AbortError') {
        throw new Error('El procesamiento excedió el tiempo límite de 15 minutos');
      }

      throw new Error(error.message || 'Error al procesar el audio');
    }
  }

  static validateAudioFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No se seleccionó ningún archivo' };
    }

    if (file.size > AUDIO_CONFIG.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `El archivo supera los ${AUDIO_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB permitidos` 
      };
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidExtension = AUDIO_CONFIG.ACCEPTED_EXTENSIONS.includes(fileExtension);
    const isValidType = AUDIO_CONFIG.ACCEPTED_FORMATS.some(format => 
      file.type.includes(format.split('/')[1])
    );

    if (!isValidExtension && !isValidType) {
      return { 
        valid: false, 
        error: 'Solo se permiten archivos de audio (MP3, WAV, M4A, OGG, FLAC)' 
      };
    }

    return { valid: true };
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
