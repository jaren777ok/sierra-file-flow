import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfGenerationService } from '@/services/pdfGenerationService';
// import { HtmlToDocumentService } from '@/services/htmlToDocumentService'; // DEPRECATED - usando Markdown ahora
import presentacion1 from '@/assets/presentacion_1.png';
import presentacion11 from '@/assets/presentacion_1_1.png';

interface PptTemplateProps {
  htmlContent: string;
  onContentChange?: (newContent: string) => void;
  onDownloadPdf?: () => Promise<void>;
  onComplete: () => void;
}

export const PptTemplate: React.FC<PptTemplateProps> = ({
  htmlContent,
  onContentChange,
  onDownloadPdf,
  onComplete
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const { toast } = useToast();

  // Split content into slides
  const contentSlides = useMemo(() => {
    if (!htmlContent) return ['<p>No hay contenido para mostrar.</p>'];
    
    // DEPRECATED: Using Markdown in SimpleWordEditor now
    // const cleanedHtml = HtmlToDocumentService.cleanHtml(htmlContent);
    // const splitSlides = HtmlToDocumentService.splitIntoSlides(cleanedHtml);
    
    console.log('📊 Content split into', 1, 'slides (fallback)');
    
    return [htmlContent]; // Fallback: just return raw content
  }, [htmlContent]);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await PdfGenerationService.generatePptPdf('presentacion.pdf');
      
      toast({
        title: "¡PDF Generado!",
        description: "La presentación se ha descargado correctamente",
      });
      
      if (onDownloadPdf) {
        await onDownloadPdf();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error al Generar PDF",
        description: "No se pudo generar el PDF. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="ppt-container">
      {/* Action Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-group ml-auto">
          <span className="text-sm text-muted-foreground mr-4">
            {contentSlides.length + 2} slides (incluye portada y final)
          </span>
          
          <Button 
            onClick={handleDownloadPdf} 
            disabled={isGeneratingPdf}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {isGeneratingPdf ? 'Generando PDF...' : 'Descargar PPT PDF'}
          </Button>
          
          <Button 
            onClick={onComplete} 
            className="gap-2 bg-sierra-teal hover:bg-sierra-teal-light"
          >
            <CheckCircle2 className="w-4 h-4" />
            Finalizar y Guardar
          </Button>
        </div>
      </div>

      {/* Professional Presentation Slides */}
      <div id="ppt-container" className="pages-container">
        {/* First Slide: Cover (Fixed) */}
        <div className="ppt-slide ppt-slide-cover">
          <img 
            src={presentacion1} 
            alt="Portada" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Slides */}
        {contentSlides.map((slideContent, index) => (
          <div key={index} className="ppt-slide">
            <div
              className="template-content ppt-content"
              dangerouslySetInnerHTML={{ __html: slideContent }}
            />
          </div>
        ))}

        {/* Last Slide: Thank You (Fixed) */}
        <div className="ppt-slide ppt-slide-end">
          <img 
            src={presentacion11} 
            alt="Gracias" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
