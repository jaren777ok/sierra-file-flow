
-- Crear tabla para rastrear trabajos de procesamiento persistentes
CREATE TABLE public.processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_title TEXT NOT NULL,
  total_files INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  progress INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  result_url TEXT,
  error_message TEXT,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view their own processing jobs" 
  ON public.processing_jobs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processing jobs" 
  ON public.processing_jobs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processing jobs" 
  ON public.processing_jobs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Crear índice para mejorar performance en consultas por usuario
CREATE INDEX idx_processing_jobs_user_id ON public.processing_jobs(user_id);
CREATE INDEX idx_processing_jobs_status ON public.processing_jobs(status);
