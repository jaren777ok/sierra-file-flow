import { corsHeaders } from '../_shared/cors.ts';

const WEBHOOK_URL = 'https://cris.cloude.es/webhook/sierra';
const TIMEOUT = 15 * 60 * 1000; // 15 minutos

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📦 [proxy-processing-upload] Iniciando proxy de procesamiento');

    // Parse FormData from frontend
    const formData = await req.formData();
    const requestId = formData.get('request_id') as string;
    const projectTitle = formData.get('project_title') as string;

    console.log(`📋 [proxy-processing-upload] Request ID: ${requestId}`);
    console.log(`📁 [proxy-processing-upload] Proyecto: ${projectTitle}`);

    // Log files info
    const entries = Array.from(formData.entries());
    const fileEntries = entries.filter(([key]) => key.includes('_') && !key.includes('_name') && !key.includes('_count'));
    console.log(`📎 [proxy-processing-upload] Total archivos: ${fileEntries.length}`);

    // Create FormData for webhook (reuse the same formData)
    console.log('📤 [proxy-processing-upload] Enviando al webhook externo...');

    // Set up timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    // Send to external webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`📥 [proxy-processing-upload] Webhook respondió con status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [proxy-processing-upload] Error del webhook: ${response.status} - ${errorText}`);
      throw new Error(`Error del webhook: ${response.status} ${response.statusText}`);
    }

    // Parse webhook response
    const data = await response.json();
    console.log('✅ [proxy-processing-upload] Respuesta del webhook:', data);

    // Validate response structure
    // The webhook returns: [{ "EXITO": "url" }] or { "EXITO": "url" }
    let downloadUrl: string | null = null;
    
    if (Array.isArray(data) && data.length > 0 && data[0].EXITO) {
      downloadUrl = data[0].EXITO;
    } else if (data.EXITO) {
      downloadUrl = data.EXITO;
    } else if (data.url) {
      downloadUrl = data.url;
    }

    if (!downloadUrl) {
      console.error('❌ [proxy-processing-upload] Respuesta inválida del webhook:', data);
      throw new Error('Respuesta del webhook sin URL de descarga válida');
    }

    console.log(`🎉 [proxy-processing-upload] Éxito! URL: ${downloadUrl}`);

    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ [proxy-processing-upload] Error:', error);

    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'El procesamiento excedió el tiempo límite de 15 minutos' }),
        { 
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Error al procesar los archivos' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
