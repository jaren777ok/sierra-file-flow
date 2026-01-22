-- Fix security warnings: set search_path for all functions

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_next_request_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.request_id_exists(request_id_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.processing_jobs 
        WHERE request_id = request_id_param
    );
END;
$$;