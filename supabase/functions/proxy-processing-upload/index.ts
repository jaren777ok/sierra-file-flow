import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const WEBHOOK_URL = 'https://cris.cloude.es/webhook/sierra';

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

    console.log('✅ [proxy-processing-upload] Job guardado en DB con status "processing"');

    // ============================================
    // FIRE AND FORGET: Enviar a webhook sin esperar respuesta
    // n8n actualizará Supabase directamente cuando termine
    // ============================================
    fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    })
      .then(() => {
        console.log('📤 [proxy-processing-upload] Archivos enviados a webhook n8n');
      })
      .catch((err) => {
        console.error('⚠️ [proxy-processing-upload] Error enviando a webhook:', err.message);
        // No marcamos como error aquí porque n8n puede seguir procesando
        // n8n es responsable de actualizar el status en Supabase
      });

    console.log('🚀 [proxy-processing-upload] Retornando inmediatamente al frontend');

    // Retornar inmediatamente al frontend (< 2 segundos)
    return new Response(
      JSON.stringify({ 
        requestId,
        status: 'processing',
        message: 'Procesamiento iniciado. n8n actualizará el estado cuando termine.'
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
