export interface AudioProcessingStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  timeElapsed: number;
}

export interface AudioFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

export interface AudioWebhookResponse {
  EXITO?: string;
  error?: string;
}
