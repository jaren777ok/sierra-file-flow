import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    
    // Validar que se envió una contraseña
    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Contraseña requerida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener contraseña del secret (nunca expuesta al frontend)
    const adminPassword = Deno.env.get('ADMIN_ACCESS_PASSWORD');
    
    if (!adminPassword) {
      console.error('ADMIN_ACCESS_PASSWORD secret not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Error de configuración del servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Comparación segura
    const isValid = password === adminPassword;

    return new Response(
      JSON.stringify({ success: isValid }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
