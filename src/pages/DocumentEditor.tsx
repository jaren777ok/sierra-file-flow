import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDocumentEditor } from '@/hooks/useDocumentEditor';
import { DocumentToolbar } from '@/components/editors/DocumentToolbar';

import { FormatToolbar } from '@/components/editors/FormatToolbar';
import { PdfGenerationService } from '@/services/pdfGenerationService';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useContentEditable } from '@/hooks/useContentEditable';
import { RefreshCw } from 'lucide-react';
import plantillaImage from '@/assets/plantilla_1.png';
import { useRealTimePageOverflow } from '@/hooks/useRealTimePageOverflow';

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

  // Page overflow detection en tiempo real
  const { registerPageRef, pageRefs } = useRealTimePageOverflow({
    pages: editablePages,
    onPagesChange: (newPages) => {
      setEditablePages(newPages);
      markAsChanged();
    },
    maxContentHeight: 1150, // 2000px - 700px (top) - 150px (bottom)
  });

  // Prevención proactiva de escritura fuera de límites
  const handleBeforeInput = useCallback((e: React.FormEvent<HTMLDivElement>, pageIndex: number) => {
    const element = pageRefs.current.get(pageIndex);
    if (!element) return;

    const contentHeight = element.scrollHeight;
    const paddingTop = 700;
    const paddingBottom = 150;
    const actualContentHeight = contentHeight - paddingTop - paddingBottom;
    const maxAllowedHeight = 1150;
    
    // Si ya está al 98% del límite, prevenir más input
    if (actualContentHeight > maxAllowedHeight * 0.98) {
      e.preventDefault();
      
      // Crear nueva página automáticamente
      const selection = window.getSelection();
      if (selection) {
        setEditablePages(prev => {
          const newPages = [...prev];
          newPages.push('<p><br></p>'); // Nueva página con párrafo vacío
          return newPages;
        });
        
        // Focus en nueva página después de un tick
        setTimeout(() => {
          const newPageIndex = editablePages.length;
          const newPageElement = pageRefs.current.get(newPageIndex);
          if (newPageElement) {
            newPageElement.focus();
            // Colocar cursor al inicio
            const range = document.createRange();
            range.setStart(newPageElement, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }, 50);
        
        markAsChanged();
      }
      
      toast({
        title: "Página llena",
        description: "Se creó una nueva página automáticamente",
        duration: 2000,
      });
    }
  }, [editablePages, toast, markAsChanged, pageRefs]);

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* TOOLBAR FIJO - SIEMPRE VISIBLE */}
      <div className="sticky top-0 z-50 bg-background border-b">
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
      </div>
      
      {/* Main Editor - Sin thumbnails */}
      <div className="flex-1 overflow-auto">
        <div 
          className="py-8 px-4" 
          id="informe-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '40px',
            backgroundColor: '#f5f5f5',
            minHeight: '100vh',
          }}
        >
          {pagesToRender.map((pageContent, index) => (
            <div
              key={index}
              className="informe-page"
              style={{
                backgroundImage: `url(${plantillaImage})`,
                backgroundSize: '1545px 2000px',
                backgroundPosition: '0 0',
                backgroundRepeat: 'no-repeat',
                width: '1545px',
                height: '2000px',
                flexShrink: 0,
              }}
              onClick={() => setCurrentPage(index)}
            >
              <div
                ref={(el) => registerPageRef(index, el)}
                className="template-content informe-content"
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={(e) => handleContentChange(index, e.currentTarget.innerHTML)}
                onBeforeInput={(e) => handleBeforeInput(e, index)}
                dangerouslySetInnerHTML={{ __html: pageContent }}
                style={{
                  width: '1545px',
                  height: '2000px',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
