
-- Limpiar trabajos pendientes/en proceso que pueden confundir la app
DELETE FROM processing_jobs WHERE status IN ('processing', 'pending');

-- Simplificar solo a estados finales claros
UPDATE processing_jobs 
SET status = 'completed' 
WHERE status NOT IN ('completed', 'error', 'timeout');
