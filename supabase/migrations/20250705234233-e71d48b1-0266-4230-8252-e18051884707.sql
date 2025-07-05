
-- Agregar campo notes a la tabla processed_files
ALTER TABLE public.processed_files 
ADD COLUMN notes TEXT DEFAULT '';
