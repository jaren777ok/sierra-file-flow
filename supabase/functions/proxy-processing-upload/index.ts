import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const WEBHOOK_URL = 'https://cris.cloude.es/webhook/sierra';
const TIMEOUT = 15 * 60 * 1000; // 15 minutos

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('📦 [proxy-processing-upload] Iniciando proxy de procesamiento');

    // Parse FormData from frontend
    const formData = await req.formData();
    const requestId = formData.get('request_id') as string;
    const projectTitle = formData.get('project_title') as string;
    const userId = formData.get('user_id') as string;

    console.log(`📋 [proxy-processing-upload] Request ID: ${requestId}`);
    console.log(`📁 [proxy-processing-upload] Proyecto: ${projectTitle}`);
    console.log(`👤 [proxy-processing-upload] User ID: ${userId}`);

    // Count files
    const entries = Array.from(formData.entries());
    const fileEntries = entries.filter(([key]) => key.includes('_') && !key.includes('_name') && !key.includes('_count'));
    const totalFiles = fileEntries.length;
    console.log(`📎 [proxy-processing-upload] Total archivos: ${totalFiles}`);

    // Save job to database with 'processing' status
    const { error: dbError } = await supabase
      .from('processing_jobs')
      .insert({
        request_id: requestId,
        project_title: projectTitle,
        total_files: totalFiles,
        user_id: userId,
        status: 'processing',
        progress: 10,
        started_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('❌ [proxy-processing-upload] Error guardando job:', dbError);
      throw new Error('Error guardando job en base de datos');
    }

    console.log('✅ [proxy-processing-upload] Job guardado en DB');

    // Start background task to process webhook response
    const backgroundTask = async () => {
      console.log('🔄 [proxy-processing-upload] Iniciando tarea en background...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

      try {
        console.log('📤 [proxy-processing-upload] Enviando al webhook externo...');
        
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`📥 [proxy-processing-upload] Webhook respondió con status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [proxy-processing-upload] Error del webhook: ${response.status}`);
          
          // Update DB with error
          await supabase
            .from('processing_jobs')
            .update({
              status: 'error',
              error_message: `Error del webhook: ${response.status}`,
              completed_at: new Date().toISOString(),
            })
            .eq('request_id', requestId);
          
          return;
        }

        // Parse webhook response
        const data = await response.json();
        console.log('✅ [proxy-processing-upload] Respuesta del webhook:', data);

        // Extract download URL
        let downloadUrl: string | null = null;
        
        if (Array.isArray(data) && data.length > 0 && data[0].EXITO) {
          downloadUrl = data[0].EXITO;
        } else if (data.EXITO) {
          downloadUrl = data.EXITO;
        } else if (data.url) {
          downloadUrl = data.url;
        }

        if (!downloadUrl) {
          console.error('❌ [proxy-processing-upload] Respuesta sin URL válida:', data);
          
          // Update DB with error
          await supabase
            .from('processing_jobs')
            .update({
              status: 'error',
              error_message: 'Respuesta del webhook sin URL de descarga válida',
              completed_at: new Date().toISOString(),
            })
            .eq('request_id', requestId);
          
          return;
        }

        console.log(`🎉 [proxy-processing-upload] Éxito! URL: ${downloadUrl}`);

        // Update DB with success
        await supabase
          .from('processing_jobs')
          .update({
            status: 'completed',
            progress: 100,
            result_url: downloadUrl,
            completed_at: new Date().toISOString(),
          })
          .eq('request_id', requestId);

        console.log('✅ [proxy-processing-upload] Job actualizado como completado');

      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('❌ [proxy-processing-upload] Error en background task:', error);

        const isTimeout = error.name === 'AbortError';
        
        // Update DB with timeout or error
        await supabase
          .from('processing_jobs')
          .update({
            status: isTimeout ? 'timeout' : 'error',
            error_message: isTimeout 
              ? 'El procesamiento excedió el tiempo límite de 15 minutos'
              : error.message || 'Error al procesar los archivos',
            completed_at: new Date().toISOString(),
          })
          .eq('request_id', requestId);
      }
    };

    // Execute background task without awaiting
    EdgeRuntime.waitUntil(backgroundTask());

    // Return immediately with request ID
    console.log('✅ [proxy-processing-upload] Retornando requestId al frontend');
    
    return new Response(
      JSON.stringify({ 
        requestId,
        status: 'processing',
        message: 'Procesamiento iniciado'
      }),
      { 
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ [proxy-processing-upload] Error:', error);

    return new Response(
      JSON.stringify({ error: error.message || 'Error al iniciar el procesamiento' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
