export const AUDIO_CONFIG = {
  WEBHOOK_URL: 'https://cris.cloude.es/webhook/audio_transcribir',
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ACCEPTED_FORMATS: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/flac'],
  ACCEPTED_EXTENSIONS: ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
  TIMEOUT: 15 * 60 * 1000, // 15 minutos
};

export const AUDIO_MESSAGES = {
  uploading: [
    'Enviando audio al servidor...',
    'Estableciendo conexión segura...',
    'Preparando archivo de audio...',
  ],
  processing: [
    'Analizando audio con IA...',
    'Transcribiendo conversación...',
    'Procesando frecuencias de voz...',
    'Identificando patrones de habla...',
    'Generando documento Word...',
    'Optimizando transcripción...',
    'Aplicando correcciones inteligentes...',
  ],
};
