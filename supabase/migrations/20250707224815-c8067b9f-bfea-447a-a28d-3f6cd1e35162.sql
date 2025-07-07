
-- Crear función para generar próximo Request_ID único
CREATE OR REPLACE FUNCTION public.generate_next_request_id()
RETURNS TEXT AS $$
DECLARE
    last_number INTEGER;
    next_id TEXT;
BEGIN
    -- Obtener el último número usado de Request_IDs con formato SIERRA-XXX
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(request_id FROM 'SIERRA-(\d+)') AS INTEGER)), 
        0
    ) INTO last_number
    FROM public.processing_jobs 
    WHERE request_id ~ '^SIERRA-\d+$';
    
    -- Generar próximo ID con formato SIERRA-XXX (3 dígitos con ceros)
    next_id := 'SIERRA-' || LPAD((last_number + 1)::TEXT, 3, '0');
    
    RETURN next_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función auxiliar para verificar si un Request_ID existe
CREATE OR REPLACE FUNCTION public.request_id_exists(request_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.processing_jobs 
        WHERE request_id = request_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear índice para optimizar búsquedas por request_id
CREATE INDEX IF NOT EXISTS idx_processing_jobs_request_id_pattern 
ON public.processing_jobs(request_id) 
WHERE request_id ~ '^SIERRA-\d+$';
