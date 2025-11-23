import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDocumentEditor } from '@/hooks/useDocumentEditor';
import { DocumentToolbar } from '@/components/editors/DocumentToolbar';
import { FormatToolbar } from '@/components/editors/FormatToolbar';
import { DocumentRuler } from '@/components/editors/DocumentRuler';
import { MarginGuides } from '@/components/editors/MarginGuides';
import { VerticalRuler } from '@/components/editors/VerticalRuler';
import { MarginGuidesHorizontal } from '@/components/editors/MarginGuidesHorizontal';
import { PdfGenerationService } from '@/services/pdfGenerationService';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useContentEditable } from '@/hooks/useContentEditable';
import { RefreshCw } from 'lucide-react';
import plantillaImage from '@/assets/plantilla_1.png';

// Constants
const PAGE_WIDTH = 1545; // A4 width in pixels at 150 DPI
const PAGE_HEIGHT = 2000; // A4 height in pixels at 150 DPI
const TOOLBAR_HEIGHT = 60;
const FORMAT_TOOLBAR_HEIGHT = 40;
const RULER_HEIGHT = 30;
const TOTAL_HEADER_HEIGHT = TOOLBAR_HEIGHT + FORMAT_TOOLBAR_HEIGHT + RULER_HEIGHT; // 130px total

const DocumentEditor = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { job, pages, loading } = useDocumentEditor(jobId || '', false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editablePages, setEditablePages] = useState<string[]>([]);
  const [leftMargin, setLeftMargin] = useState(350);
  const [rightMargin, setRightMargin] = useState(350);
  const [topMargin, setTopMargin] = useState(700);
  const [bottomMargin, setBottomMargin] = useState(150);
  const [effectiveWidth, setEffectiveWidth] = useState(845);
  const [isDraggingMargin, setIsDraggingMargin] = useState(false);
  const [isDraggingVerticalMargin, setIsDraggingVerticalMargin] = useState(false);
  const { toast } = useToast();

  // Initialize editable pages when pages load
  React.useEffect(() => {
    if (pages.length > 0 && editablePages.length === 0) {
      setEditablePages(pages);
    }
  }, [pages]);

  // Calculate effective width when margins change
  useEffect(() => {
    setEffectiveWidth(PAGE_WIDTH - leftMargin - rightMargin);
  }, [leftMargin, rightMargin]);

  // Auto-save hook
  const { isSaving, lastSaved, hasUnsavedChanges, saveNow, markAsChanged } = useAutoSave(
    jobId || '',
    editablePages
  );

  // Handle margin changes
  const handleLeftMarginChange = useCallback((margin: number) => {
    setLeftMargin(margin);
    markAsChanged();
  }, [markAsChanged]);

  const handleRightMarginChange = useCallback((margin: number) => {
    setRightMargin(margin);
    markAsChanged();
  }, [markAsChanged]);

  const handleTopMarginChange = useCallback((margin: number) => {
    setTopMargin(margin);
    markAsChanged();
  }, [markAsChanged]);

  const handleBottomMarginChange = useCallback((margin: number) => {
    setBottomMargin(margin);
    markAsChanged();
  }, [markAsChanged]);

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

  // DESACTIVADO: useRealTimePageOverflow
  // El contenido viene pre-paginado con PAGE_BREAK del backend
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const registerPageRef = useCallback((index: number, element: HTMLDivElement | null) => {
    if (element) {
      pageRefs.current.set(index, element);
    } else {
      pageRefs.current.delete(index);
    }
  }, []);

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
    <div className="min-h-screen bg-background flex">
      {/* Vertical Ruler - Fixed left */}
      <VerticalRuler
        pageHeight={PAGE_HEIGHT}
        topMargin={topMargin}
        bottomMargin={bottomMargin}
        onTopMarginChange={handleTopMarginChange}
        onBottomMarginChange={handleBottomMarginChange}
        onDraggingChange={setIsDraggingVerticalMargin}
        headerHeight={TOTAL_HEADER_HEIGHT}
      />

      <div className="flex-1 flex flex-col">
        {/* Toolbar superior fijo */}
        <div className="sticky top-0 z-50 bg-background border-b shadow-md">
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

        {/* Regla con marcadores arrastrables - STICKY INDEPENDIENTE */}
        <div className="sticky z-[45] bg-[#f5f5f5] shadow-sm" style={{ top: `${TOOLBAR_HEIGHT + FORMAT_TOOLBAR_HEIGHT}px` }}>
        <DocumentRuler
          pageWidth={PAGE_WIDTH}
          leftMargin={leftMargin}
          rightMargin={rightMargin}
          onLeftMarginChange={handleLeftMarginChange}
          onRightMarginChange={handleRightMarginChange}
          onDraggingChange={setIsDraggingMargin}
        />
        </div>

        {/* Vertical margin guide lines */}
        <MarginGuides
          pageWidth={PAGE_WIDTH}
          leftMargin={leftMargin}
          rightMargin={rightMargin}
          rulerHeight={TOTAL_HEADER_HEIGHT}
          isDragging={isDraggingMargin}
        />

        {/* Horizontal margin guide lines */}
        <MarginGuidesHorizontal
          pageHeight={PAGE_HEIGHT}
          topMargin={topMargin}
          bottomMargin={bottomMargin}
          rulerWidth={40}
          headerHeight={TOTAL_HEADER_HEIGHT}
          isDragging={isDraggingVerticalMargin}
        />

        {/* Contenedor principal scrollable */}
        <div className="flex-1 bg-[#f5f5f5]">
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
                    paddingLeft: `${leftMargin}px`,
                    paddingRight: `${rightMargin}px`,
                    paddingTop: `${topMargin}px`,
                    paddingBottom: `${bottomMargin}px`,
                }}
              />
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
