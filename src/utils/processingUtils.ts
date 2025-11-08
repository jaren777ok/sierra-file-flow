
import { PROCESSING_CONSTANTS } from '@/constants/processing';
import { ProjectFiles } from '@/hooks/useMultiStepUpload';

export const generateRequestId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `SIERRA-${timestamp}-${random}`;
};

export const calculateTotalFiles = (
  projectFiles?: ProjectFiles,
  files?: File[]
): number => {
  if (projectFiles) {
    const companyInfoCount = projectFiles.companyInfo.length;
    const areasCount = Object.values(projectFiles.areas).reduce((acc, fileArray) => {
      return acc + (Array.isArray(fileArray) ? fileArray.length : 0);
    }, 0);
    const customCount = projectFiles.customAreas.reduce((acc, area) => {
      return acc + area.files.length;
    }, 0);
    return companyInfoCount + areasCount + customCount;
  }
  return files?.length || 0;
};

export const createFormData = (
  projectTitle: string,
  files: File[],
  userId: string,
  requestId: string,
  projectFiles?: ProjectFiles
): FormData => {
  const formData = new FormData();
  formData.append('request_id', requestId);
  formData.append('project_title', projectTitle);
  formData.append('user_id', userId);
  
  if (projectFiles) {
    let totalFiles = 0;
    
    // 1. Información de la empresa
    if (projectFiles.companyInfo.length > 0) {
      totalFiles += projectFiles.companyInfo.length;
      formData.append('companyInfo_count', projectFiles.companyInfo.length.toString());
      projectFiles.companyInfo.forEach((file, index) => {
        formData.append(`companyInfo_${index}`, file);
        formData.append(`companyInfo_${index}_name`, file.name);
      });
    }
    
    // 2. Áreas fijas
    const activeAreas: string[] = [];
    PROCESSING_CONSTANTS.AREAS.forEach(area => {
      const areaFilesList = projectFiles.areas[area] || [];
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
    
    // 3. Áreas personalizadas
    if (projectFiles.customAreas.length > 0) {
      formData.append('custom_areas_count', projectFiles.customAreas.length.toString());
      
      projectFiles.customAreas.forEach((customArea) => {
        const areaKey = `custom_${customArea.id}`;
        formData.append(`${areaKey}_name`, customArea.name);
        formData.append(`${areaKey}_count`, customArea.files.length.toString());
        
        customArea.files.forEach((file, fileIndex) => {
          formData.append(`${areaKey}_${fileIndex}`, file);
          formData.append(`${areaKey}_${fileIndex}_name`, file.name);
        });
        
        totalFiles += customArea.files.length;
      });
    }
    
    formData.append('total_files', totalFiles.toString());
    if (activeAreas.length > 0) {
      formData.append('active_areas', activeAreas.join(','));
    }
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
