import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PdfGenerationService } from '@/services/pdfGenerationService';
import { HtmlToDocumentService } from '@/services/htmlToDocumentService';
import { 
  Download, 
  CheckCircle2,
  Bold, 
  Italic, 
  Underline,
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered
} from 'lucide-react';
import presentacion1 from '@/assets/presentacion_1.png';
import presentacion11 from '@/assets/presentacion_1_1.png';

interface PptTemplateProps {
  htmlContent: string;
  onContentChange: (newContent: string) => void;
  onDownloadPdf: () => Promise<void>;
  onComplete: () => void;
}

export const PptTemplate = ({
  htmlContent,
  onContentChange,
  onDownloadPdf,
  onComplete
}: PptTemplateProps) => {
  const [slides, setSlides] = useState<string[]>([]);
  const [currentFont, setCurrentFont] = useState('Arial');
  const [fontSize, setFontSize] = useState('14');
  const [textColor, setTextColor] = useState('#000000');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Split content into slides
    const splitSlides = HtmlToDocumentService.splitIntoSlides(htmlContent);
    setSlides(splitSlides);
  }, [htmlContent]);

  const handleSlideContentChange = (index: number) => {
    const slideElement = slideRefs.current[index];
    if (slideElement) {
      const newContent = slideElement.innerHTML;
      const newSlides = [...slides];
      newSlides[index] = newContent;
      setSlides(newSlides);
      
      // Notify parent of all slides content
      const allContent = newSlides.join('\n');
      onContentChange(allContent);
    }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    applyFormat('fontName', font);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    slideRefs.current.forEach(ref => {
      if (ref) {
        ref.style.fontSize = `${size}pt`;
      }
    });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setTextColor(color);
    applyFormat('foreColor', color);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await PdfGenerationService.generatePptPdf('presentacion.pdf');
      toast({
        title: "PDF Generado",
        description: "La presentación se ha descargado correctamente",
      });
      if (onDownloadPdf) {
        await onDownloadPdf();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen ppt-container">
      {/* Toolbar */}
      <div className="editor-toolbar bg-gray-800 border-gray-700">
        <div className="editor-toolbar-group">
          <Select value={currentFont} onValueChange={handleFontChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Fuente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Calibri">Calibri</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
            </SelectContent>
          </Select>

          <Select value={fontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Tamaño" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12pt</SelectItem>
              <SelectItem value="14">14pt</SelectItem>
              <SelectItem value="16">16pt</SelectItem>
              <SelectItem value="18">18pt</SelectItem>
              <SelectItem value="20">20pt</SelectItem>
              <SelectItem value="24">24pt</SelectItem>
            </SelectContent>
          </Select>

          <div className="color-picker-wrapper">
            <input
              type="color"
              value={textColor}
              onChange={handleColorChange}
              className="color-picker"
              title="Color de texto"
            />
          </div>
        </div>

        <div className="editor-toolbar-group">
          <button
            className="editor-button"
            onClick={() => applyFormat('bold')}
            title="Negrita"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            className="editor-button"
            onClick={() => applyFormat('italic')}
            title="Cursiva"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            className="editor-button"
            onClick={() => applyFormat('underline')}
            title="Subrayado"
          >
            <Underline className="h-4 w-4" />
          </button>
        </div>

        <div className="editor-toolbar-group">
          <button
            className="editor-button"
            onClick={() => applyFormat('justifyLeft')}
            title="Alinear izquierda"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            className="editor-button"
            onClick={() => applyFormat('justifyCenter')}
            title="Centrar"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            className="editor-button"
            onClick={() => applyFormat('justifyRight')}
            title="Alinear derecha"
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>

        <div className="editor-toolbar-group">
          <button
            className="editor-button"
            onClick={() => applyFormat('insertUnorderedList')}
            title="Lista con viñetas"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            className="editor-button"
            onClick={() => applyFormat('insertOrderedList')}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1"></div>

        <Button 
          onClick={handleDownloadPdf} 
          disabled={isGeneratingPdf}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isGeneratingPdf ? 'Generando...' : 'Descargar PPT PDF'}
        </Button>
        
        <Button onClick={onComplete} className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Finalizar y Guardar
        </Button>
      </div>

      {/* Slides Container */}
      <div id="ppt-container" className="max-w-[297mm] mx-auto py-8">
        {/* First Slide: Cover */}
        <div className="ppt-slide ppt-slide-cover">
          <div className="template-background">
            <img src={presentacion1} alt="Portada" />
          </div>
        </div>

        {/* Content Slides */}
        {slides.map((slide, index) => (
          <div key={index} className="ppt-slide">
            <div
              ref={el => slideRefs.current[index] = el}
              className="template-content ppt-content"
              contentEditable
              suppressContentEditableWarning
              onInput={() => handleSlideContentChange(index)}
              dangerouslySetInnerHTML={{ __html: slide }}
              style={{
                fontFamily: currentFont,
                fontSize: `${fontSize}pt`,
                color: textColor
              }}
            />
          </div>
        ))}

        {/* Last Slide: Thank You */}
        <div className="ppt-slide ppt-slide-end">
          <div className="template-background">
            <img src={presentacion11} alt="Gracias" />
          </div>
        </div>
      </div>
    </div>
  );
};
