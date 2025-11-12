export interface AreaFiles {
  comercial: File[];
  operaciones: File[];
  pricing: File[];
  administracion: File[];
}

export interface CustomArea {
  id: string;
  name: string;
  icon: string;
  files: File[];
}

export interface ProjectFiles {
  companyInfo: File[];
  areas: AreaFiles;
  customAreas: CustomArea[];
}

export interface ProcessingStatus {
  status: 'idle' | 'sending' | 'processing' | 'completed' | 'timeout' | 'error';
  progress: number;
  message: string;
  timeElapsed: number;
  showConfetti?: boolean;
  requestId?: string;
  resultUrl?: string;
  sendTimestamp?: number;
}

export interface ProcessingFormData {
  projectTitle: string;
  files: File[];
  projectFiles?: ProjectFiles;
  userId: string;
  requestId: string;
  companyAnalysis?: string;
  resultHtml?: string;
}
