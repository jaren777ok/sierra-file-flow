import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDocumentEditor } from '@/hooks/useDocumentEditor';
import { DocumentToolbar } from '@/components/editors/DocumentToolbar';
import { PageThumbnails } from '@/components/editors/PageThumbnails';
import { PdfGenerationService } from '@/services/pdfGenerationService';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import presentacionImage from '@/assets/presentacion_1.png';

const PresentationEditor = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { job, pages, loading } = useDocumentEditor(jobId || '', true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      toast({
        title: "Generando PDF",
        description: "Esto puede tomar unos momentos...",
      });

      await PdfGenerationService.generatePptPdf(`${job?.project_title || 'presentacion'}.pdf`);

      toast({
        title: "¡PDF Generado!",
        description: "El archivo se ha descargado correctamente.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 text-[hsl(var(--sierra-teal))] animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando presentación...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Presentación no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DocumentToolbar
        title={job.project_title}
        onDownloadPdf={handleDownloadPdf}
        isGenerating={isGenerating}
      />
      
      <div className="flex">
        <PageThumbnails
          pages={pages}
          currentPage={currentPage}
          onPageSelect={setCurrentPage}
        />
        
        <div className="flex-1 overflow-auto">
          <div className="py-8 px-4" id="ppt-container">
            <div className="max-w-[297mm] mx-auto space-y-8">
              {pages.map((slideContent, index) => (
                <div
                  key={index}
                  className="ppt-slide"
                  style={{
                    backgroundImage: `url(${presentacionImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <div
                    className="template-content ppt-content"
                    dangerouslySetInnerHTML={{ __html: slideContent }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationEditor;
