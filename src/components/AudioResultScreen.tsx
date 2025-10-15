import React from 'react';
import { Download, CheckCircle2, RotateCcw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioResultScreenProps {
  downloadUrl: string;
  originalFileName: string;
  processingTime: number;
  onStartNew: () => void;
}

export const AudioResultScreen = ({ 
  downloadUrl, 
  originalFileName, 
  processingTime,
  onStartNew 
}: AudioResultScreenProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-8">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary))_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-2xl w-full">
        {/* Success icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="h-16 w-16 text-white relative z-10" />
          </div>
        </div>

        {/* Title */}
        <div className="animate-fade-in space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            ¡Transcripción <span className="text-green-600">Completada!</span>
          </h1>
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950 px-6 py-3 rounded-full border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              Documento Word generado
            </span>
          </div>
        </div>

        {/* File info */}
        <div className="bg-card border border-border rounded-xl p-8 space-y-6 shadow-lg">
          <div className="flex items-center justify-center gap-3 text-foreground flex-wrap">
            <FileText className="h-6 w-6 text-primary" />
            <p className="text-base">
              Archivo original: <span className="font-semibold">{originalFileName}</span>
            </p>
          </div>

          <div className="text-muted-foreground text-sm">
            Tiempo de procesamiento: {formatTime(processingTime)}
          </div>

          {/* Download button */}
          <Button
            onClick={handleDownload}
            size="lg"
            className="w-full py-6 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Download className="h-6 w-6 mr-2" />
            Descargar Transcripción Word
          </Button>

          {/* Start new button */}
          <Button
            onClick={onStartNew}
            variant="outline"
            size="lg"
            className="w-full py-4"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Transcribir Otro Audio
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          El documento se descargará automáticamente al hacer clic en el botón
        </p>
      </div>
    </div>
  );
};
