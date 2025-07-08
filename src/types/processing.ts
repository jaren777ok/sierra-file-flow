
export interface ProcessingStatus {
  status: 'idle' | 'sending' | 'processing' | 'completed' | 'timeout' | 'error';
  progress: number;
  message: string;
  timeElapsed: number;
  showConfetti?: boolean;
  requestId?: string;
}

export interface ProcessingFormData {
  projectTitle: string;
  files: File[];
  areaFiles?: Record<string, File[]>;
  userId: string;
  requestId: string;
}
