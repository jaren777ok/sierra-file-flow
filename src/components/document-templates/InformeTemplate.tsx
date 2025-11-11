import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PdfGenerationService } from '@/services/pdfGenerationService';
import { 
  Download, 
  ArrowRight, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  AlignJustify,
  List,
  ListOrdered
} from 'lucide-react';
import plantilla1 from '@/assets/plantilla_1.png';

interface InformeTemplateProps {
  htmlContent: string;
  onContentChange: (newContent: string) => void;
  onDownloadPdf: () => Promise<void>;
  onContinue: () => void;
}

export const InformeTemplate = ({
  htmlContent,
  onContentChange,
  onDownloadPdf,
  onContinue
}: InformeTemplateProps) => {
  const [content, setContent] = useState(htmlContent);
  const [currentFont, setCurrentFont] = useState('Arial');
  const [fontSize, setFontSize] = useState('12');
  const [textColor, setTextColor] = useState('#000000');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleContentChange = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerHTML;
      setContent(newContent);
      onContentChange(newContent);
    }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentChange();
  };

  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    applyFormat('fontName', font);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    if (contentRef.current) {
      contentRef.current.style.fontSize = `${size}pt`;
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setTextColor(color);
    applyFormat('foreColor', color);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await PdfGenerationService.generateInformePdf('informe.pdf');
      toast({
        title: "PDF Generado",
        description: "El informe se ha descargado correctamente",
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
    <div className="min-h-screen informe-container">
      {/* Toolbar */}
      <div className="editor-toolbar">
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
              <SelectItem value="10">10pt</SelectItem>
              <SelectItem value="11">11pt</SelectItem>
              <SelectItem value="12">12pt</SelectItem>
              <SelectItem value="14">14pt</SelectItem>
              <SelectItem value="16">16pt</SelectItem>
              <SelectItem value="18">18pt</SelectItem>
              <SelectItem value="20">20pt</SelectItem>
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
          <button
            className="editor-button"
            onClick={() => applyFormat('justifyFull')}
            title="Justificar"
          >
            <AlignJustify className="h-4 w-4" />
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
          {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
        </Button>
        
        <Button onClick={onContinue} className="gap-2">
          Continuar a PPT
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Pages Container */}
      <div id="informe-container" className="max-w-[210mm] mx-auto py-8">
        <div className="informe-page">
          <div className="template-background">
            <img src={plantilla1} alt="Plantilla" />
          </div>
          <div
            ref={contentRef}
            className="template-content informe-content"
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentChange}
            dangerouslySetInnerHTML={{ __html: content }}
            style={{
              fontFamily: currentFont,
              fontSize: `${fontSize}pt`,
              color: textColor
            }}
          />
        </div>
      </div>
    </div>
  );
};
