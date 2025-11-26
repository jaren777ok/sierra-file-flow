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

    // Send files to webhook and WAIT for HTML response
    console.log('📤 [proxy-processing-upload] Enviando archivos al webhook y esperando respuesta...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT); // 15 minutes

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log(`📥 [proxy-processing-upload] Webhook respondió: ${response.status}`);
      
      if (!response.ok) {
        console.error(`⚠️ [proxy-processing-upload] Webhook retornó error: ${response.status}`);
        
        // Update DB with error
        await supabase
          .from('processing_jobs')
          .update({
            status: 'error',
            error_message: `Error del webhook: ${response.status}`,
            progress: 0,
            completed_at: new Date().toISOString(),
          })
          .eq('request_id', requestId);
          
        return new Response(
          JSON.stringify({ 
            error: `Error del webhook: ${response.status}`,
            requestId
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Parse HTML response from webhook
      const webhookResult = await response.json();
      console.log('🎉 [proxy-processing-upload] Webhook completó procesamiento');
      
      // Extract HTML from format: [{"EXITO": "<!DOCTYPE HTML>..."}]
      let resultHtml = '';
      if (Array.isArray(webhookResult) && webhookResult.length > 0 && webhookResult[0]?.EXITO) {
        resultHtml = webhookResult[0].EXITO;
        console.log(`✅ [proxy-processing-upload] HTML extraído: ${resultHtml.length} caracteres`);
      } else if (typeof webhookResult === 'string') {
        resultHtml = webhookResult;
      }
      
      if (!resultHtml) {
        console.error('⚠️ [proxy-processing-upload] No se pudo extraer HTML de la respuesta');
        
        await supabase
          .from('processing_jobs')
          .update({
            status: 'error',
            error_message: 'Respuesta del webhook sin HTML',
            progress: 0,
            completed_at: new Date().toISOString(),
          })
          .eq('request_id', requestId);
          
        return new Response(
          JSON.stringify({ 
            error: 'Respuesta del webhook sin HTML',
            requestId
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Save completed job with HTML to database
      const { error: updateError } = await supabase
        .from('processing_jobs')
        .update({
          status: 'completed',
          progress: 100,
          result_html: resultHtml,
          completed_at: new Date().toISOString(),
        })
        .eq('request_id', requestId);
        
      if (updateError) {
        console.error('❌ [proxy-processing-upload] Error actualizando job:', updateError);
        throw new Error('Error guardando resultado en base de datos');
      }
      
      console.log('✅ [proxy-processing-upload] Job completado y HTML guardado en BD');
      
      // Return success with HTML preview
      return new Response(
        JSON.stringify({ 
          requestId,
          status: 'completed',
          message: 'Procesamiento completado',
          resultHtml: resultHtml.substring(0, 500) + '...' // Preview only
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ [proxy-processing-upload] Error procesando:', error);
      
      const isTimeout = error.name === 'AbortError';
      const errorMessage = isTimeout 
        ? 'Procesamiento excedió el tiempo límite (15 minutos)' 
        : `Error al procesar: ${error.message}`;
      
      // Update DB with error or timeout
      await supabase
        .from('processing_jobs')
        .update({
          status: isTimeout ? 'timeout' : 'error',
          error_message: errorMessage,
          progress: 0,
          completed_at: new Date().toISOString(),
        })
        .eq('request_id', requestId);
        
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          requestId
        }),
        { 
          status: isTimeout ? 408 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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
