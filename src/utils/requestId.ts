
/**
 * Genera un Request ID único para tracking de solicitudes
 * Formato: req_YYYYMMDD_HHMM_[6 caracteres aleatorios]
 */
export const generateRequestId = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(11, 16).replace(':', '');
  const randomStr = Math.random().toString(36).substring(2, 8);
  
  return `req_${dateStr}_${timeStr}_${randomStr}`;
};

/**
 * Crea metadata JSON para la solicitud
 */
export const createRequestMetadata = (
  requestId: string,
  projectTitle: string,
  activeAreas: string[],
  totalFiles: number
) => {
  return JSON.stringify({
    requestId,
    projectTitle,
    areas: activeAreas,
    totalFiles,
    timestamp: Date.now(),
    version: '1.0'
  });
};
