-- ============================================================
-- CONFIGURACIÓN COMPLETA PARA APP SIERRA - SUPABASE OSIRIS
-- ============================================================

-- 1. CREAR ENUM PARA ESTADOS
CREATE TYPE processing_status AS ENUM ('processing', 'completed', 'error', 'timeout');

-- 2. TABLA: profiles (perfiles de usuario)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  display_name TEXT,
  account_type TEXT NOT NULL DEFAULT 'vendedor',
  company_code TEXT,
  profile_photo_url TEXT,
  timezone TEXT DEFAULT 'America/Mexico_City',
  ghl_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. TABLA: processing_jobs (trabajos de procesamiento)
CREATE TABLE public.processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  project_title TEXT NOT NULL,
  total_files INTEGER NOT NULL,
  user_id UUID NOT NULL,
  status processing_status NOT NULL DEFAULT 'processing',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  result_url TEXT,
  result_html TEXT,
  result_html_ppt TEXT,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. TABLA: processed_files (archivos procesados)
CREATE TABLE public.processed_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_title TEXT NOT NULL,
  area TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_files ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. POLÍTICAS RLS - profiles
-- ============================================================
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ============================================================
-- 7. POLÍTICAS RLS - processing_jobs
-- ============================================================
CREATE POLICY "Users can view their own processing jobs" 
  ON public.processing_jobs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processing jobs" 
  ON public.processing_jobs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processing jobs" 
  ON public.processing_jobs FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================================
-- 8. POLÍTICAS RLS - processed_files
-- ============================================================
CREATE POLICY "Users can view their own processed files" 
  ON public.processed_files FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processed files" 
  ON public.processed_files FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processed files" 
  ON public.processed_files FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================================
-- 9. FUNCIONES SQL
-- ============================================================

-- Función para actualizar timestamps automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para crear perfil cuando usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

-- Función para generar Request ID secuencial (SIERRA-001, SIERRA-002, etc.)
CREATE OR REPLACE FUNCTION public.generate_next_request_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_number INTEGER;
    next_id TEXT;
BEGIN
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(request_id FROM 'SIERRA-(\d+)') AS INTEGER)), 
        0
    ) INTO last_number
    FROM public.processing_jobs 
    WHERE request_id ~ '^SIERRA-\d+$';
    
    next_id := 'SIERRA-' || LPAD((last_number + 1)::TEXT, 3, '0');
    
    RETURN next_id;
END;
$$;

-- Función para verificar si Request ID existe
CREATE OR REPLACE FUNCTION public.request_id_exists(request_id_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.processing_jobs 
        WHERE request_id = request_id_param
    );
END;
$$;

-- ============================================================
-- 10. TRIGGERS
-- ============================================================

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processing_jobs_updated_at
  BEFORE UPDATE ON public.processing_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processed_files_updated_at
  BEFORE UPDATE ON public.processed_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 11. ÍNDICES PARA RENDIMIENTO
-- ============================================================
CREATE INDEX idx_processing_jobs_user_id ON public.processing_jobs(user_id);
CREATE INDEX idx_processing_jobs_status ON public.processing_jobs(status);
CREATE INDEX idx_processing_jobs_request_id ON public.processing_jobs(request_id);
CREATE INDEX idx_processing_jobs_created_at ON public.processing_jobs(created_at DESC);
CREATE INDEX idx_processed_files_user_id ON public.processed_files(user_id);