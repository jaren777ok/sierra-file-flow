import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDocumentEditor } from '@/hooks/useDocumentEditor';
import { DocumentToolbar } from '@/components/editors/DocumentToolbar';
import { PageThumbnails } from '@/components/editors/PageThumbnails';
import { PdfGenerationService } from '@/services/pdfGenerationService';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import plantillaImage from '@/assets/plantilla_1.png';

const DocumentEditor = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { job, pages, loading } = useDocumentEditor(jobId || '', false);
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

      await PdfGenerationService.generateInformePdf(`${job?.project_title || 'documento'}.pdf`);

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
          <p className="text-muted-foreground">Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Documento no encontrado</p>
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
          <div className="py-8 px-4" id="informe-container">
            <div className="max-w-[210mm] mx-auto space-y-8">
              {pages.map((pageContent, index) => (
                <div
                  key={index}
                  className="informe-page"
                  style={{
                    backgroundImage: `url(${plantillaImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <div
                    className="template-content informe-content"
                    dangerouslySetInnerHTML={{ __html: pageContent }}
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

export default DocumentEditor;
