
-- Agregar campos necesarios a la tabla processing_jobs
ALTER TABLE public.processing_jobs 
ADD COLUMN request_id TEXT UNIQUE,
ADD COLUMN webhook_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Crear índice para el request_id para búsquedas rápidas
CREATE INDEX idx_processing_jobs_request_id ON public.processing_jobs(request_id);

-- Actualizar trabajos existentes con request_id basado en su id
UPDATE public.processing_jobs 
SET request_id = 'legacy_' || id::text 
WHERE request_id IS NULL;

-- Hacer request_id NOT NULL después de la actualización
ALTER TABLE public.processing_jobs 
ALTER COLUMN request_id SET NOT NULL;
