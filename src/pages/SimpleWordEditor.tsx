import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSimpleAutoSave } from '@/hooks/useSimpleAutoSave';
import { SimplePdfService } from '@/services/simplePdfService';
import { SimpleToolbar } from '@/components/editors/SimpleToolbar';

const PAGE_WIDTH = 793; // A4 width in pixels (21cm at 96 DPI)

// Function to clean HTML - extract only body content and remove \n literals
const cleanHtml = (rawHtml: string): string => {
  // 1. Convert \n literals (backslash + n) to actual newlines
  let cleaned = rawHtml.replace(/\\n/g, '\n');
  
  // 2. Convert escaped quotes \" to normal quotes "
  cleaned = cleaned.replace(/\\"/g, '"');
  
  // 3. Extract content between <body> and </body>
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1].trim();
  } else {
    // If no body structure, clean DOCTYPE, html, head tags
    cleaned = cleaned
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>|<\/html>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>|<\/body>/gi, '')
      .trim();
  }
  
  // 4. Remove remaining newlines between tags (not needed in HTML)
  cleaned = cleaned.replace(/>\s*\n\s*</g, '><');
  
  return cleaned;
};

// Function to apply inline styles for copying to Word/Google Docs
const applyInlineStylesForCopy = (element: HTMLElement): HTMLElement => {
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Apply styles to tables
  clone.querySelectorAll('table').forEach(table => {
    table.setAttribute('style', 'width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10pt;');
  });
  
  // Apply styles to th
  clone.querySelectorAll('th').forEach(th => {
    th.setAttribute('style', 'border: 1px solid #000; padding: 6pt 8pt; text-align: left; background-color: #f0f0f0; font-weight: 700;');
  });
  
  // Apply styles to td
  clone.querySelectorAll('td').forEach(td => {
    td.setAttribute('style', 'border: 1px solid #000; padding: 6pt 8pt; text-align: left;');
  });
  
  // Apply styles to headings
  clone.querySelectorAll('h1').forEach(h1 => {
    h1.setAttribute('style', 'font-size: 24pt; font-weight: 800; text-align: center; margin: 24pt 0 16pt 0; border-bottom: 2px solid #000;');
  });
  
  clone.querySelectorAll('h2').forEach(h2 => {
    h2.setAttribute('style', 'font-size: 16pt; font-weight: 700; margin: 20pt 0 10pt 0; text-transform: uppercase;');
  });
  
  clone.querySelectorAll('h3').forEach(h3 => {
    h3.setAttribute('style', 'font-size: 13pt; font-weight: 700; margin: 14pt 0 8pt 0; text-transform: uppercase;');
  });
  
  // Apply styles to paragraphs
  clone.querySelectorAll('p').forEach(p => {
    p.setAttribute('style', 'margin-bottom: 8pt; text-align: justify; line-height: 1.5;');
  });
  
  // Apply styles to lists
  clone.querySelectorAll('ul').forEach(ul => {
    ul.setAttribute('style', 'margin: 8pt 0; padding-left: 24pt; list-style-type: disc;');
  });
  
  clone.querySelectorAll('ol').forEach(ol => {
    ol.setAttribute('style', 'margin: 8pt 0; padding-left: 24pt; list-style-type: decimal;');
  });
  
  clone.querySelectorAll('li').forEach(li => {
    li.setAttribute('style', 'margin-bottom: 4pt; line-height: 1.5;');
  });
  
  // Apply styles to strong/bold
  clone.querySelectorAll('strong, b').forEach(el => {
    el.setAttribute('style', 'font-weight: 700;');
  });
  
  return clone;
};

export default function SimpleWordEditor() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  const [htmlContent, setHtmlContent] = useState<string>('');
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load job content from Supabase on mount
  useEffect(() => {
    const loadJobContent = async () => {
      if (!jobId) {
        toast({
          title: "Error",
          description: "No se especificó un ID de trabajo",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        setIsLoading(true);
        console.log('📂 Cargando contenido del job:', jobId);

        const { data, error } = await supabase
          .from('processing_jobs')
          .select('result_html, project_title')
          .eq('id', jobId)
          .single();

        if (error) throw error;

        if (data?.result_html) {
          // Clean HTML - extract only body content
          const cleanedHtml = cleanHtml(data.result_html);
          setHtmlContent(cleanedHtml);
          setProjectTitle(data.project_title || 'Documento Sin Título');
          console.log('✅ HTML limpio cargado:', cleanedHtml.length, 'caracteres');
        } else {
          throw new Error('No se encontró contenido en el job');
        }
      } catch (error) {
        console.error('❌ Error cargando contenido:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el contenido del documento",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadJobContent();
  }, [jobId, navigate, toast]);

  // Get current content from editor
  const getCurrentContent = () => {
    return contentRef.current?.innerHTML || htmlContent;
  };

  // Manual save hook
  const { isSaving, lastSaved, saveNow } = useSimpleAutoSave(jobId || '', getCurrentContent);

  // Handle format commands
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // Handle copy all content WITH formatting (HTML)
  const handleCopyAll = async () => {
    try {
      const content = contentRef.current;
      if (!content) return;

      // Apply inline styles for proper formatting in Word/Docs
      const styledContent = applyInlineStylesForCopy(content);
      
      // Get HTML content WITH inline styles
      const htmlContent = styledContent.innerHTML;
      // Get plain text as fallback
      const plainText = content.innerText || content.textContent || '';
      
      // Create blobs for both formats
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      
      // Copy to clipboard with both formats
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
      
      toast({
        title: "¡Copiado con formato!",
        description: "Pega en Word o Google Docs para mantener tablas y formato",
      });
    } catch (error) {
      console.error('❌ Error copiando con formato:', error);
      
      // Fallback to plain text if ClipboardItem not supported
      try {
        const plainText = contentRef.current?.innerText || '';
        await navigator.clipboard.writeText(plainText);
        toast({
          title: "Copiado (sin formato)",
          description: "Tu navegador no soporta copiar con formato",
        });
      } catch (fallbackError) {
        toast({
          title: "Error",
          description: "No se pudo copiar el texto",
          variant: "destructive",
        });
      }
    }
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    try {
      console.log('📄 Generando PDF...');
      await SimplePdfService.generatePdf(`${projectTitle}.pdf`);
      toast({
        title: "¡PDF Generado!",
        description: "El documento se descargó correctamente",
      });
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sierra-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Toolbar sticky */}
      <SimpleToolbar
        onFormat={handleFormat}
        onSave={saveNow}
        onDownloadPdf={handleDownloadPdf}
        onCopyAll={handleCopyAll}
        onBack={() => navigate('/')}
        isSaving={isSaving}
        lastSaved={lastSaved}
        title={projectTitle}
      />

      {/* Main content area - single scrollable page */}
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="mx-auto" style={{ width: `${PAGE_WIDTH}px` }}>
          {/* Single page container */}
          <div 
            className="page-container bg-white shadow-lg"
            style={{
              width: `${PAGE_WIDTH}px`,
              minHeight: '500px',
              padding: '60px',
            }}
          >
            {/* Content area */}
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              className="page-content-area focus:outline-none"
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: '11pt',
                lineHeight: '1.6',
                color: '#000',
                minHeight: '400px',
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
