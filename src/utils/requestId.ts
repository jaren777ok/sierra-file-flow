
import { supabase } from '@/integrations/supabase/client';

/**
 * Genera un Request ID único usando la función SQL de Supabase
 * Formato: SIERRA-001, SIERRA-002, etc.
 */
export const generateRequestId = async (): Promise<string> => {
  try {
    console.log('🆔 Generando nuevo Request ID desde Supabase...');
    
    const { data, error } = await supabase.rpc('generate_next_request_id');
    
    if (error) {
      console.error('❌ Error al generar Request ID:', error);
      throw new Error(`Error generando Request ID: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No se recibió Request ID de la función SQL');
    }
    
    console.log(`✅ Request ID generado exitosamente: ${data}`);
    return data;
    
  } catch (error) {
    console.error('❌ Error en generateRequestId:', error);
    
    // Fallback: generar ID temporal si hay error de conexión
    const fallbackId = `SIERRA-TEMP-${Date.now()}`;
    console.warn(`⚠️ Usando ID temporal como fallback: ${fallbackId}`);
    return fallbackId;
  }
};

/**
 * Verifica si un Request ID existe en la base de datos
 */
export const requestIdExists = async (requestId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('request_id_exists', {
      request_id_param: requestId
    });
    
    if (error) {
      console.error('❌ Error verificando Request ID:', error);
      return false;
    }
    
    return data === true;
    
  } catch (error) {
    console.error('❌ Error en requestIdExists:', error);
    return false;
  }
};

/**
 * Funciones legacy para compatibilidad (ahora usan Supabase)
 */
export const getLastRequestId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('request_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return null;
    return data.request_id;
    
  } catch (error) {
    console.error('❌ Error obteniendo último Request ID:', error);
    return null;
  }
};

/**
 * Función de desarrollo para resetear contador (mantiene compatibilidad)
 */
export const resetRequestCounter = (): void => {
  console.log('🔄 resetRequestCounter() llamado - los Request IDs ahora se manejan en Supabase');
  console.log('💡 Para resetear, eliminar registros directamente de processing_jobs si es necesario');
};
