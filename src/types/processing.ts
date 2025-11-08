import { ProjectFiles } from '@/hooks/useMultiStepUpload';

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
  projectFiles?: ProjectFiles;
  userId: string;
  requestId: string;
  companyAnalysis?: string;
}
