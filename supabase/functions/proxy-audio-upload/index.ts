import { corsHeaders } from '../_shared/cors.ts';

const WEBHOOK_URL = 'https://cris.cloude.es/webhook/audio_transcribir';
const TIMEOUT = 15 * 60 * 1000; // 15 minutos

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 [proxy-audio-upload] Iniciando proxy de audio');

    // Parse FormData from frontend
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('❌ [proxy-audio-upload] No se recibió archivo de audio');
      return new Response(
        JSON.stringify({ error: 'No se recibió archivo de audio' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📦 [proxy-audio-upload] Recibido: ${audioFile.name} (${(audioFile.size / (1024 * 1024)).toFixed(2)} MB)`);

    // Create FormData for webhook
    const webhookFormData = new FormData();
    webhookFormData.append('audio', audioFile, audioFile.name);

    console.log('📤 [proxy-audio-upload] Enviando al webhook externo...');

    // Set up timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    // Send to external webhook with streaming
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: webhookFormData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`📥 [proxy-audio-upload] Webhook respondió con status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [proxy-audio-upload] Error del webhook: ${response.status} - ${errorText}`);
      throw new Error(`Error del webhook: ${response.status} ${response.statusText}`);
    }

    // Parse webhook response
    const data = await response.json();
    console.log('✅ [proxy-audio-upload] Respuesta del webhook:', data);

    // Validate response structure
    if (!data || !Array.isArray(data) || data.length === 0 || !data[0].EXITO) {
      console.error('❌ [proxy-audio-upload] Respuesta inválida del webhook:', data);
      throw new Error('Respuesta del webhook sin URL de descarga válida');
    }

    const downloadUrl = data[0].EXITO;
    console.log(`🎉 [proxy-audio-upload] Éxito! URL: ${downloadUrl}`);

    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ [proxy-audio-upload] Error:', error);

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
      JSON.stringify({ error: error.message || 'Error al procesar el audio' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
