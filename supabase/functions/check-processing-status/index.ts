import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: 'requestId es requerido' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔍 [check-processing-status] Consultando status para: ${requestId}`);

    // Query job status from database
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (error || !data) {
      console.error(`❌ [check-processing-status] Job no encontrado: ${requestId}`, error);
      return new Response(
        JSON.stringify({ 
          status: 'not_found',
          error: 'Job no encontrado'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ [check-processing-status] Status: ${data.status}, Progress: ${data.progress}%`);

    return new Response(
      JSON.stringify({
        status: data.status,
        progress: data.progress,
        resultUrl: data.result_url,
        resultHtml: data.result_html,
        errorMessage: data.error_message,
        startedAt: data.started_at,
        completedAt: data.completed_at,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ [check-processing-status] Error:', error);

    return new Response(
      JSON.stringify({ error: error.message || 'Error al consultar el status' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
