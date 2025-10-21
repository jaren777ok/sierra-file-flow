-- Agregar el valor 'processing' al ENUM processing_status
-- Este valor es necesario para el estado inicial de los jobs
ALTER TYPE processing_status ADD VALUE IF NOT EXISTS 'processing';