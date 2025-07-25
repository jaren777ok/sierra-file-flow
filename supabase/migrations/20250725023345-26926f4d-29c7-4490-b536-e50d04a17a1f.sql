-- Create enum for processing job status
CREATE TYPE processing_status AS ENUM ('completed', 'error', 'timeout');

-- Create processing_jobs table
CREATE TABLE public.processing_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT NOT NULL UNIQUE,
    project_title TEXT NOT NULL,
    total_files INTEGER NOT NULL,
    user_id UUID NOT NULL,
    status processing_status NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    result_url TEXT,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create processed_files table
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

-- Enable RLS on both tables
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for processing_jobs
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

-- RLS Policies for processed_files
CREATE POLICY "Users can view their own processed files" 
ON public.processed_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processed files" 
ON public.processed_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processed files" 
ON public.processed_files 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate next request ID
CREATE OR REPLACE FUNCTION public.generate_next_request_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_number INTEGER;
    next_id TEXT;
BEGIN
    -- Get the last number used from Request_IDs with format SIERRA-XXX
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(request_id FROM 'SIERRA-(\d+)') AS INTEGER)), 
        0
    ) INTO last_number
    FROM public.processing_jobs 
    WHERE request_id ~ '^SIERRA-\d+$';
    
    -- Generate next ID with format SIERRA-XXX (3 digits with zeros)
    next_id := 'SIERRA-' || LPAD((last_number + 1)::TEXT, 3, '0');
    
    RETURN next_id;
END;
$$;

-- Create function to check if request ID exists
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

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_processing_jobs_updated_at
    BEFORE UPDATE ON public.processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processed_files_updated_at
    BEFORE UPDATE ON public.processed_files
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indices for better performance
CREATE INDEX idx_processing_jobs_user_id ON public.processing_jobs(user_id);
CREATE INDEX idx_processing_jobs_status ON public.processing_jobs(status);
CREATE INDEX idx_processing_jobs_created_at ON public.processing_jobs(created_at DESC);

CREATE INDEX idx_processed_files_user_id ON public.processed_files(user_id);
CREATE INDEX idx_processed_files_created_at ON public.processed_files(created_at DESC);