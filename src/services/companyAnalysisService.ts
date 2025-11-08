export class CompanyAnalysisService {
  static async sendCompanyFiles(files: File[], userId: string): Promise<string> {
    console.log('📊 Enviando archivos de empresa para análisis:', {
      fileCount: files.length,
      userId
    });

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('total_files', files.length.toString());
    
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
      formData.append(`file_${index}_name`, file.name);
    });
    
    try {
      const response = await fetch('https://cris.cloude.es/webhook/analisis_empresa', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Análisis recibido:', result);
      
      // Resultado esperado: [{ "analisis": "## Markdown content..." }]
      if (Array.isArray(result) && result[0]?.analisis) {
        return result[0].analisis;
      }
      
      throw new Error('Formato de respuesta inválido: falta campo "analisis"');
    } catch (error) {
      console.error('❌ Error al analizar empresa:', error);
      throw error;
    }
  }
}
