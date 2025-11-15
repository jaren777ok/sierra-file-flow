import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, FileText, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DocumentToolbarProps {
  title: string;
  onDownloadPdf: () => void;
  onSave?: () => void;
  isGenerating?: boolean;
  isSaving?: boolean;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
}

export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
  title,
  onDownloadPdf,
  onSave,
  isGenerating = false,
  isSaving = false,
  lastSaved,
  hasUnsavedChanges = false,
}) => {
  const navigate = useNavigate();

  const getLastSavedText = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    
    if (diff < 60) return 'Guardado hace unos segundos';
    if (diff < 3600) return `Guardado hace ${Math.floor(diff / 60)} min`;
    return `Guardado hace ${Math.floor(diff / 3600)} h`;
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/saved-files')}
              variant="outline"
              size="sm"
              className="border-sierra-teal/30 text-[hsl(var(--sierra-teal))] hover:bg-[hsl(var(--sierra-teal))] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[hsl(var(--sierra-teal))]" />
              <h1 className="text-lg font-semibold truncate max-w-md">{title}</h1>
            </div>
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                {hasUnsavedChanges ? '• Cambios sin guardar' : getLastSavedText()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onSave && (
              <Button
                onClick={onSave}
                disabled={isSaving || !hasUnsavedChanges}
                variant="outline"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
            <Button
              onClick={onDownloadPdf}
              disabled={isGenerating}
              size="sm"
              className="bg-[hsl(var(--sierra-teal))] hover:bg-[hsl(var(--sierra-teal))]/90 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generando...' : 'Descargar PDF'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
