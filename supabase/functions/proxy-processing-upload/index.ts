import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const WEBHOOK_URL = 'https://cris.cloude.es/webhook/sierra';
const TIMEOUT = 15 * 60 * 1000; // 15 minutos

// Handler para logging cuando la función se apaga
addEventListener('beforeunload', (ev: any) => {
  console.log(`🛑 [proxy-processing-upload] Shutdown: ${ev.detail?.reason || 'unknown'}`);
});

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

    // ============================================
    // BACKGROUND TASK: Procesar en segundo plano
    // ============================================
    async function processInBackground() {
      console.log('🔄 [Background] Iniciando procesamiento en segundo plano...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

      try {
        console.log('📤 [Background] Enviando archivos al webhook...');
        
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        console.log(`📥 [Background] Webhook respondió: ${response.status}`);
        
        if (!response.ok) {
          console.error(`⚠️ [Background] Webhook retornó error: ${response.status}`);
          
          await supabase
            .from('processing_jobs')
            .update({
              status: 'error',
              error_message: `Error del webhook: ${response.status}`,
              progress: 0,
              completed_at: new Date().toISOString(),
            })
            .eq('request_id', requestId);
          return;
        }
        
        // Parse response from webhook
        const webhookResult = await response.json();
        console.log('🎉 [Background] Webhook completó procesamiento');
        
        // Extract HTML from NEW format: [{"informe": "html word", "ppt": "html ppt"}]
        // With fallback to old format: [{"EXITO": "<!DOCTYPE HTML>..."}]
        let resultHtmlInforme = '';
        let resultHtmlPpt = '';

        if (Array.isArray(webhookResult) && webhookResult.length > 0) {
          const webhookData = webhookResult[0];
          
          // New format with separate fields
          if (webhookData?.informe) {
            resultHtmlInforme = webhookData.informe;
            console.log(`✅ [Background] HTML Informe extraído: ${resultHtmlInforme.length} caracteres`);
          }
          
          if (webhookData?.ppt) {
            resultHtmlPpt = webhookData.ppt;
            console.log(`✅ [Background] HTML PPT extraído: ${resultHtmlPpt.length} caracteres`);
          }
          
          // Fallback to old format for backwards compatibility
          if (!resultHtmlInforme && webhookData?.EXITO) {
            resultHtmlInforme = webhookData.EXITO;
            resultHtmlPpt = webhookData.EXITO;
            console.log(`⚠️ [Background] Usando formato antiguo EXITO: ${resultHtmlInforme.length} caracteres`);
          }
        } else if (typeof webhookResult === 'string') {
          resultHtmlInforme = webhookResult;
          resultHtmlPpt = webhookResult;
        }
        
        if (!resultHtmlInforme) {
          console.error('⚠️ [Background] No se pudo extraer HTML de la respuesta');
          
          await supabase
            .from('processing_jobs')
            .update({
              status: 'error',
              error_message: 'Respuesta del webhook sin HTML',
              progress: 0,
              completed_at: new Date().toISOString(),
            })
            .eq('request_id', requestId);
          return;
        }
        
        // Save completed job with BOTH HTML fields to database
        const { error: updateError } = await supabase
          .from('processing_jobs')
          .update({
            status: 'completed',
            progress: 100,
            result_html: resultHtmlInforme,
            result_html_ppt: resultHtmlPpt || resultHtmlInforme,
            completed_at: new Date().toISOString(),
          })
          .eq('request_id', requestId);
          
        if (updateError) {
          console.error('❌ [Background] Error actualizando job:', updateError);
        } else {
          console.log('✅ [Background] Job completado y HTML guardado en BD');
        }
        
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('❌ [Background] Error procesando:', error);
        
        const isTimeout = error.name === 'AbortError';
        const errorMessage = isTimeout 
          ? 'Procesamiento excedió el tiempo límite (15 minutos)' 
          : `Error al procesar: ${error.message}`;
        
        await supabase
          .from('processing_jobs')
          .update({
            status: isTimeout ? 'timeout' : 'error',
            error_message: errorMessage,
            progress: 0,
            completed_at: new Date().toISOString(),
          })
          .eq('request_id', requestId);
      }
    }

    // ============================================
    // INICIAR TAREA EN BACKGROUND Y RETORNAR INMEDIATAMENTE
    // ============================================
    EdgeRuntime.waitUntil(processInBackground());
    
    console.log('🚀 [proxy-processing-upload] Retornando inmediatamente, procesamiento continúa en background');

    // Retornar inmediatamente al frontend (< 5 segundos)
    return new Response(
      JSON.stringify({ 
        requestId,
        status: 'processing',
        message: 'Procesamiento iniciado en segundo plano'
      }),
      { 
        status: 200,
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
