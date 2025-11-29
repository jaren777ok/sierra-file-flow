import { 
  ArrowLeft, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Undo,
  Redo,
  Download,
  Save,
  Check,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SimpleToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onSave: () => void;
  onDownloadPdf: () => void;
  onCopyAll: () => void;
  onBack: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
  title: string;
}

export const SimpleToolbar = ({
  onFormat,
  onSave,
  onDownloadPdf,
  onCopyAll,
  onBack,
  isSaving,
  lastSaved,
  title
}: SimpleToolbarProps) => {
  const formatButtonClass = "h-8 w-8 p-0 hover:bg-sierra-teal/10 hover:text-sierra-teal";
  
  return (
    <div className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      {/* Main toolbar */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Save indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSaving ? (
              <>
                <Save className="h-4 w-4 animate-pulse" />
                <span>Guardando...</span>
              </>
            ) : lastSaved ? (
              <>
                <Check className="h-4 w-4 text-sierra-teal" />
                <span>
                  Guardado {formatDistanceToNow(lastSaved, { addSuffix: true, locale: es })}
                </span>
              </>
            ) : null}
          </div>

          {/* Copy All */}
          <Button
            variant="outline"
            size="sm"
            onClick={onCopyAll}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar Todo
          </Button>

          {/* Download PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadPdf}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Format toolbar */}
      <div className="flex items-center gap-2 px-6 py-2 border-t border-border bg-muted/30">
        {/* Text formatting */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={formatButtonClass}
            onClick={() => onFormat('bold')}
            title="Negrita (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={formatButtonClass}
            onClick={() => onFormat('italic')}
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={formatButtonClass}
            onClick={() => onFormat('underline')}
            title="Subrayado (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Font size */}
        <Select onValueChange={(value) => onFormat('fontSize', value)}>
          <SelectTrigger className="w-[80px] h-8">
            <SelectValue placeholder="12" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">10pt</SelectItem>
            <SelectItem value="2">12pt</SelectItem>
            <SelectItem value="3">14pt</SelectItem>
            <SelectItem value="4">16pt</SelectItem>
            <SelectItem value="5">18pt</SelectItem>
            <SelectItem value="6">20pt</SelectItem>
            <SelectItem value="7">24pt</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border" />

        {/* Alignment */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={formatButtonClass}
            onClick={() => onFormat('justifyLeft')}
            title="Alinear izquierda"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={formatButtonClass}
            onClick={() => onFormat('justifyCenter')}
            title="Centrar"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={formatButtonClass}
            onClick={() => onFormat('justifyRight')}
            title="Alinear derecha"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={formatButtonClass}
            onClick={() => onFormat('insertUnorderedList')}
            title="Lista con viñetas"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={formatButtonClass}
            onClick={() => onFormat('insertOrderedList')}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={formatButtonClass}
            onClick={() => onFormat('undo')}
            title="Deshacer (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={formatButtonClass}
            onClick={() => onFormat('redo')}
            title="Rehacer (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
