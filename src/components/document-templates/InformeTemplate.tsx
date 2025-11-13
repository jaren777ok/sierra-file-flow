import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PdfGenerationService } from '@/services/pdfGenerationService';
import { HtmlToDocumentService } from '@/services/htmlToDocumentService';
import plantillaImage from '@/assets/plantilla_1.png';

interface InformeTemplateProps {
  htmlContent: string;
  onContentChange?: (newContent: string) => void;
  onDownloadPdf?: () => Promise<void>;
  onContinue: () => void;
}

export const InformeTemplate: React.FC<InformeTemplateProps> = ({ 
  htmlContent, 
  onContentChange,
  onDownloadPdf,
  onContinue 
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const { toast } = useToast();
  
  // Parse and paginate HTML content
  const pages = useMemo(() => {
    if (!htmlContent) return ['<p>No hay contenido para mostrar.</p>'];
    
    const cleanedHtml = HtmlToDocumentService.cleanHtml(htmlContent);
    const paginatedContent = HtmlToDocumentService.splitIntoPages(cleanedHtml);
    
    console.log('📄 Content paginated:', paginatedContent.length, 'pages');
    
    return paginatedContent;
  }, [htmlContent]);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await PdfGenerationService.generateInformePdf('informe.pdf');
      
      toast({
        title: "¡PDF Generado!",
        description: "El informe se ha descargado correctamente",
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
    <div className="informe-container">
      {/* Action Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-group ml-auto">
          <span className="text-sm text-muted-foreground mr-4">
            {pages.length} página{pages.length !== 1 ? 's' : ''}
          </span>
          
          <Button 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF'}
          </Button>
          
          <Button 
            onClick={onContinue}
            className="gap-2 bg-sierra-teal hover:bg-sierra-teal-light"
          >
            Continuar a PPT
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Professional Multi-Page Document */}
      <div id="informe-container" className="pages-container">
        {pages.map((pageContent, index) => (
          <div 
            key={index} 
            className="informe-page"
            style={{ backgroundImage: `url(${plantillaImage})` }}
          >
            <div
              className="template-content informe-content"
              dangerouslySetInnerHTML={{ __html: pageContent }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
