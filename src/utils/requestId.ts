
/**
 * Genera un Request ID simple e incremental para tracking de solicitudes
 * Formato: SIERRA-001, SIERRA-002, etc.
 */
export const generateRequestId = (): string => {
  // Obtener el contador actual del localStorage
  const currentCount = parseInt(localStorage.getItem('sierra_request_counter') || '0', 10);
  const nextCount = currentCount + 1;
  
  // Guardar el nuevo contador
  localStorage.setItem('sierra_request_counter', nextCount.toString());
  
  // Generar el ID con formato SIERRA-XXX (3 dígitos con ceros a la izquierda)
  const requestId = `SIERRA-${nextCount.toString().padStart(3, '0')}`;
  
  console.log(`🆔 Generando nuevo Request ID: ${requestId}`);
  
  return requestId;
};

/**
 * Obtiene el último Request ID generado (útil para recuperación)
 */
export const getLastRequestId = (): string | null => {
  const currentCount = parseInt(localStorage.getItem('sierra_request_counter') || '0', 10);
  if (currentCount === 0) return null;
  
  return `SIERRA-${currentCount.toString().padStart(3, '0')}`;
};

/**
 * Resetea el contador (solo para desarrollo/testing)
 */
export const resetRequestCounter = (): void => {
  localStorage.removeItem('sierra_request_counter');
  console.log('🔄 Contador de Request ID reseteado');
};
