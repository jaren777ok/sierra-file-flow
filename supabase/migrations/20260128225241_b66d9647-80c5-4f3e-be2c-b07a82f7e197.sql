-- Crear tabla para guardar contraseñas en texto plano (vault de contraseñas admin)
CREATE TABLE public.password_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,
  user_password TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS pero sin políticas públicas (solo accesible via service_role)
ALTER TABLE public.password_vault ENABLE ROW LEVEL SECURITY;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_password_vault_updated_at
BEFORE UPDATE ON public.password_vault
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentario para documentar el propósito
COMMENT ON TABLE public.password_vault IS 'Almacena contraseñas en texto plano para recuperación por administradores. Solo accesible via Edge Functions con service_role.';