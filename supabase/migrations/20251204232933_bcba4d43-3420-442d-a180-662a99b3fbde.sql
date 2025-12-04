-- Add new column for PPT HTML content (separate from Word editor content)
ALTER TABLE processing_jobs 
ADD COLUMN IF NOT EXISTS result_html_ppt TEXT;

COMMENT ON COLUMN processing_jobs.result_html_ppt IS 'HTML content for PPT editor, separate from Word editor content (result_html)';