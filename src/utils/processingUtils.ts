
import { PROCESSING_CONSTANTS } from '@/constants/processing';

export const generateRequestId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `SIERRA-${timestamp}-${random}`;
};

export const calculateTotalFiles = (
  areaFiles: Record<string, File[]> | undefined, 
  files: File[]
): number => {
  if (areaFiles) {
    return Object.values(areaFiles).reduce((acc: number, fileArray: File[]) => {
      const count = Array.isArray(fileArray) ? fileArray.length : 0;
      return acc + count;
    }, 0);
  }
  return files.length;
};

export const createFormData = (
  projectTitle: string,
  files: File[],
  userId: string,
  requestId: string,
  areaFiles?: Record<string, File[]>
): FormData => {
  const formData = new FormData();
  formData.append('request_id', requestId);
  formData.append('project_title', projectTitle);
  formData.append('user_id', userId);
  
  if (areaFiles) {
    // Formato organizado por área
    let totalFiles = 0;
    const activeAreas: string[] = [];
    
    PROCESSING_CONSTANTS.AREAS.forEach(area => {
      const areaFilesList = areaFiles[area] || [];
      if (areaFilesList.length > 0) {
        activeAreas.push(area);
        totalFiles += areaFilesList.length;
        formData.append(`${area}_count`, areaFilesList.length.toString());
        
        areaFilesList.forEach((file: File, index: number) => {
          formData.append(`${area}_${index}`, file);
          formData.append(`${area}_${index}_name`, file.name);
        });
      }
    });
    
    formData.append('total_files', totalFiles.toString());
    formData.append('active_areas', activeAreas.join(','));
  } else {
    // Formato legacy
    formData.append('total_files', files.length.toString());
    files.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });
  }
  
  formData.append('timestamp', Date.now().toString());
  return formData;
};

export const extractDownloadUrl = (result: any): string | null => {
  if (Array.isArray(result) && result.length > 0 && result[0].EXITO) {
    return result[0].EXITO;
  }
  if (result.EXITO) {
    return result.EXITO;
  }
  if (result.url) {
    return result.url;
  }
  return null;
};
