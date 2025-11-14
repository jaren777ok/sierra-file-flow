import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DocumentToolbarProps {
  title: string;
  onDownloadPdf: () => void;
  isGenerating?: boolean;
}

export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
  title,
  onDownloadPdf,
  isGenerating = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-4">
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
          </div>
          
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
  );
};
