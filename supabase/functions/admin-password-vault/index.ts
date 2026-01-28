import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar contraseña de admin
    const adminPassword = req.headers.get('x-admin-password');
    const expectedPassword = Deno.env.get('ADMIN_ACCESS_PASSWORD');

    if (!adminPassword || adminPassword !== expectedPassword) {
      return new Response(
        JSON.stringify({ error: 'Acceso no autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente con service_role para bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    if (req.method === 'POST') {
      // Guardar contraseña
      const { action, email, password, created_by } = await req.json();

      if (action === 'save') {
        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: 'Email y contraseña son requeridos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('password_vault')
          .upsert({
            user_email: email.toLowerCase().trim(),
            user_password: password,
            created_by: created_by || null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_email'
          });

        if (error) {
          console.error('Error saving password:', error);
          return new Response(
            JSON.stringify({ error: 'Error al guardar contraseña' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Contraseña guardada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'list') {
        // Listar todos los usuarios con contraseñas
        const { data, error } = await supabaseAdmin
          .from('password_vault')
          .select('id, user_email, created_at, updated_at')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error listing passwords:', error);
          return new Response(
            JSON.stringify({ error: 'Error al obtener lista' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, users: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'get') {
        // Obtener contraseña de un usuario específico
        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email es requerido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabaseAdmin
          .from('password_vault')
          .select('user_password')
          .eq('user_email', email.toLowerCase().trim())
          .maybeSingle();

        if (error) {
          console.error('Error getting password:', error);
          return new Response(
            JSON.stringify({ error: 'Error al obtener contraseña' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Usuario no encontrado en vault' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, password: data.user_password }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Acción no válida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-password-vault:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
