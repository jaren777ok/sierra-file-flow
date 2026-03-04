import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminPassword = req.headers.get('x-admin-password');
    const expectedPassword = Deno.env.get('ADMIN_ACCESS_PASSWORD');

    if (!adminPassword || adminPassword !== expectedPassword) {
      return new Response(
        JSON.stringify({ error: 'Acceso no autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    if (req.method === 'POST') {
      const { action, email, password, created_by } = await req.json();

      if (action === 'create_user') {
        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: 'Email y contraseña son requeridos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 1. Create user via admin API (no auto-login)
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email.toLowerCase().trim(),
          password,
          email_confirm: true
        });

        if (createError) {
          console.error('Error creating user:', createError);
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 2. Save password to vault
        const { error: vaultError } = await supabaseAdmin
          .from('password_vault')
          .upsert({
            user_email: email.toLowerCase().trim(),
            user_password: password,
            created_by: created_by || null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_email'
          });

        if (vaultError) {
          console.error('Error saving to vault:', vaultError);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Usuario creado y contraseña guardada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
