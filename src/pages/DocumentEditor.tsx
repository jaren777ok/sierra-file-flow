import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDocumentEditor } from '@/hooks/useDocumentEditor';
import { DocumentToolbar } from '@/components/editors/DocumentToolbar';
import { PageThumbnails } from '@/components/editors/PageThumbnails';
import { FormatToolbar } from '@/components/editors/FormatToolbar';
import { PdfGenerationService } from '@/services/pdfGenerationService';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useContentEditable } from '@/hooks/useContentEditable';
import { RefreshCw } from 'lucide-react';
import plantillaImage from '@/assets/plantilla_1.png';
import { usePageOverflow } from '@/hooks/usePageOverflow';

const DocumentEditor = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { job, pages, loading } = useDocumentEditor(jobId || '', false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editablePages, setEditablePages] = useState<string[]>([]);
  const { toast } = useToast();

  // Initialize editable pages when pages load
  React.useEffect(() => {
    if (pages.length > 0 && editablePages.length === 0) {
      setEditablePages(pages);
    }
  }, [pages]);

  // Auto-save hook
  const { isSaving, lastSaved, hasUnsavedChanges, saveNow, markAsChanged } = useAutoSave(
    jobId || '',
    editablePages
  );

  // Content change handler
  const handleContentChange = useCallback((index: number, newContent: string) => {
    setEditablePages(prev => {
      const updated = [...prev];
      updated[index] = newContent;
      return updated;
    });
    markAsChanged();
  }, [markAsChanged]);

  // Content editable hook
  const formatHandlers = useContentEditable(handleContentChange);

  // Page overflow detection
  const { registerPageRef } = usePageOverflow({
    pages: editablePages,
    onPagesChange: (newPages) => {
      setEditablePages(newPages);
      markAsChanged();
    },
    maxHeight: 1150, // 2000px - 700px (top) - 150px (bottom)
  });

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

  const pagesToRender = editablePages.length > 0 ? editablePages : pages;

  return (
    <div className="min-h-screen bg-background">
      <DocumentToolbar
        title={job.project_title}
        onDownloadPdf={handleDownloadPdf}
        onSave={saveNow}
        isGenerating={isGenerating}
        isSaving={isSaving}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      
      <FormatToolbar onFormat={formatHandlers} />
      
      <div className="flex">
        <PageThumbnails
          pages={pagesToRender}
          currentPage={currentPage}
          onPageSelect={setCurrentPage}
        />
        
        <div className="flex-1 overflow-auto">
          <div className="py-8 px-4" id="informe-container">
            <div className="max-w-[210mm] mx-auto space-y-8">
              {pagesToRender.map((pageContent, index) => (
                <div
                  key={index}
                  className="informe-page"
                  style={{
                    backgroundImage: `url(${plantillaImage})`,
                    backgroundSize: '1545px 2000px',
                    backgroundPosition: 'top left',
                    backgroundRepeat: 'no-repeat',
                  }}
                  onClick={() => setCurrentPage(index)}
                >
                  <div
                    ref={(el) => registerPageRef(index, el)}
                    className="template-content informe-content"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleContentChange(index, e.currentTarget.innerHTML)}
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
