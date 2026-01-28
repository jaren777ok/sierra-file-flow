

## Plan: Crear Sistema de Vault de Contraseñas para Administradores

### Concepto de la Solución

Crear una tabla `password_vault` donde se guarde la contraseña en texto plano **antes** de crear el usuario en Supabase Auth. Esto permite que el administrador pueda ver las contraseñas posteriormente.

### Flujo Propuesto

```text
FLUJO ACTUAL:
┌─────────────────┐     ┌─────────────────┐
│ Admin ingresa   │────>│ signUp() crea   │
│ email + password│     │ usuario en Auth │
└─────────────────┘     └─────────────────┘

FLUJO NUEVO:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Admin ingresa   │────>│ Guardar en      │────>│ signUp() crea   │
│ email + password│     │ password_vault  │     │ usuario en Auth │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ Admin puede ver │
                        │ contraseña luego│
                        └─────────────────┘
```

### Cambios Requeridos

#### 1. Nueva Tabla: `password_vault`

```sql
CREATE TABLE public.password_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,
  user_password TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS muy restrictivo: solo admins pueden ver/modificar
ALTER TABLE public.password_vault ENABLE ROW LEVEL SECURITY;

-- Por ahora sin política de SELECT público (solo service_role puede leer)
-- Las consultas se harán via Edge Function con service_role
```

#### 2. Nueva Edge Function: `admin-password-vault`

Una edge function que:
- **POST**: Guarda la contraseña antes de crear usuario
- **GET**: Recupera la contraseña de un usuario (verificando admin access)

```typescript
// POST /admin-password-vault
{ action: "save", email: "user@email.com", password: "xxx" }

// GET /admin-password-vault?email=user@email.com
{ password: "xxx" }
```

#### 3. Modificar Auth.tsx - Flujo de Registro

Antes de llamar `signUp()`, guardar la contraseña en el vault:

```typescript
// En handleSubmit, ANTES de signUp:
if (!isLogin && isAdminVerified) {
  // 1. Guardar en vault
  await supabase.functions.invoke('admin-password-vault', {
    body: { action: 'save', email, password }
  });
  
  // 2. Luego crear usuario normal
  const { error } = await signUp(email, password);
}
```

#### 4. Nuevo Componente: Panel de Admin para Ver Contraseñas

Un nuevo componente/página donde el admin puede:
- Ver lista de usuarios con botón "Ver Contraseña"
- Al hacer clic, consulta la edge function y muestra la contraseña

### Archivos a Crear/Modificar

| Tipo | Archivo | Descripción |
|------|---------|-------------|
| Nuevo | `supabase/functions/admin-password-vault/index.ts` | Edge function para guardar/recuperar contraseñas |
| Nuevo | `src/pages/AdminPanel.tsx` | Panel de administración con lista de usuarios |
| Modificar | `src/pages/Auth.tsx` | Agregar lógica para guardar en vault antes de signup |
| Modificar | `src/App.tsx` | Agregar ruta `/admin` |
| Modificar | `src/components/Header.tsx` | Agregar enlace a Admin Panel (solo para admins) |
| Migración | SQL | Crear tabla `password_vault` |

### Estructura del Panel de Admin

```text
┌────────────────────────────────────────────────────┐
│ 🔐 Panel de Administración                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ Usuarios Registrados                         │  │
│  ├──────────────────────────────────────────────┤  │
│  │ Email              │ Creado    │ Contraseña  │  │
│  ├──────────────────────────────────────────────┤  │
│  │ juan@email.com     │ 22-Ene    │ [👁️ Ver]   │  │
│  │ maria@email.com    │ 23-Ene    │ [👁️ Ver]   │  │
│  │ pedro@email.com    │ 28-Ene    │ [👁️ Ver]   │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Al hacer clic en "Ver":                          │
│  ┌──────────────────────────────────────────────┐  │
│  │ Contraseña de juan@email.com: miPassword123  │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Seguridad Implementada

1. **Edge Function con verificación**: La edge function `admin-password-vault` verificará el `ADMIN_ACCESS_PASSWORD` antes de mostrar cualquier contraseña
2. **RLS sin SELECT público**: La tabla `password_vault` no tiene política SELECT pública - solo accessible via service_role
3. **Acceso protegido**: El panel de admin requerirá verificación de contraseña admin (igual que crear usuarios)

### Edge Function: admin-password-vault

```typescript
// Estructura básica
Deno.serve(async (req) => {
  // CORS handling...
  
  // Verificar password de admin en header o body
  const adminPassword = req.headers.get('x-admin-password');
  const expectedPassword = Deno.env.get('ADMIN_ACCESS_PASSWORD');
  
  if (adminPassword !== expectedPassword) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const supabaseAdmin = createClient(url, serviceRoleKey);
  
  if (req.method === 'POST') {
    // Guardar contraseña
    const { email, password } = await req.json();
    await supabaseAdmin.from('password_vault').upsert({
      user_email: email,
      user_password: password
    });
  }
  
  if (req.method === 'GET') {
    // Recuperar contraseña
    const email = new URL(req.url).searchParams.get('email');
    const { data } = await supabaseAdmin
      .from('password_vault')
      .select('user_password')
      .eq('user_email', email)
      .single();
    return Response.json({ password: data?.user_password });
  }
});
```

### Flujo de Usuario Final

1. **Admin va a `/auth`** → Click "Opciones de Admin" → Ingresa contraseña admin
2. **Admin crea usuario** → Ingresa email y contraseña del nuevo usuario
3. **Al hacer submit**:
   - Primero se guarda en `password_vault`
   - Luego se crea el usuario en Supabase Auth
4. **Después, si el usuario olvida su contraseña**:
   - Admin va a `/admin` → Ingresa contraseña admin
   - Ve la lista de usuarios → Click "Ver Contraseña"
   - Se muestra la contraseña guardada

