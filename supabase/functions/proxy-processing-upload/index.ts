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

    // Send files to webhook (fire-and-forget, just confirm receipt)
    // N8n will process in background and update the DB directly when done
    const sendToWebhook = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout just to confirm receipt

      try {
        console.log('📤 [proxy-processing-upload] Enviando archivos al webhook...');
        
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        console.log(`📥 [proxy-processing-upload] Webhook confirmó recepción: ${response.status}`);
        
        if (!response.ok) {
          console.error(`⚠️ [proxy-processing-upload] Webhook retornó error: ${response.status}`);
          // Update DB with error
          await supabase
            .from('processing_jobs')
            .update({
              status: 'error',
              error_message: `Error al enviar al webhook: ${response.status}`,
              completed_at: new Date().toISOString(),
            })
            .eq('request_id', requestId);
        }
        
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('❌ [proxy-processing-upload] Error enviando al webhook:', error);
        
        // Update DB with error
        await supabase
          .from('processing_jobs')
          .update({
            status: 'error',
            error_message: 'Error al enviar archivos al webhook',
            completed_at: new Date().toISOString(),
          })
          .eq('request_id', requestId);
      }
    };

    // Send to webhook without waiting (N8n will update DB when done)
    sendToWebhook();

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
