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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 dark:from-background dark:via-background dark:to-background relative overflow-hidden flex items-center justify-center p-4 md:p-8">
      {/* Dynamic background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--success))_2px,transparent_2px),linear-gradient(90deg,hsl(var(--success))_2px,transparent_2px)] bg-[size:60px_60px]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${6 + Math.random() * 10}px`,
              height: `${6 + Math.random() * 10}px`,
              background: i % 2 === 0 
                ? 'linear-gradient(135deg, hsl(var(--success)), hsl(var(--primary)))' 
                : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--success)))',
              opacity: 0.15,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${4 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center space-y-6 md:space-y-10 max-w-3xl w-full">
        {/* Success icon with animation */}
        <div className="relative mb-8 animate-fade-in">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full success-gradient blur-3xl opacity-40 animate-pulse" />
          </div>
          <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full success-gradient flex items-center justify-center shadow-2xl animate-bounce" style={{ animationDuration: '1s', animationIterationCount: '2' }}>
            <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-white relative z-10" />
          </div>
        </div>

        {/* Title */}
        <div className="animate-fade-in space-y-4 md:space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground px-4">
            ¡Transcripción <span className="success-gradient bg-clip-text text-transparent">Completada!</span>
          </h1>
          <div className="inline-flex items-center gap-2 md:gap-3 bg-green-100 dark:bg-green-950 px-6 md:px-8 py-3 md:py-4 rounded-full border-2 border-green-300 dark:border-green-700 shadow-lg">
            <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400 animate-pulse" />
            <span className="text-green-700 dark:text-green-300 font-semibold text-sm md:text-base">
              Documento Word generado exitosamente
            </span>
          </div>
        </div>

        {/* File info card */}
        <div className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-2 border-green-200 dark:border-green-800 rounded-3xl p-6 md:p-10 space-y-6 md:space-y-8 shadow-2xl mx-4">
          <div className="flex items-center justify-center gap-3 text-foreground flex-wrap px-2">
            <FileText className="h-6 w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />
            <p className="text-sm md:text-base break-all">
              <span className="text-muted-foreground">Archivo original:</span>{' '}
              <span className="font-bold">{originalFileName}</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm md:text-base">
            <span className="font-medium">Tiempo de procesamiento:</span>
            <span className="font-mono font-bold text-primary">{formatTime(processingTime)}</span>
          </div>

          {/* Download button */}
          <Button
            onClick={handleDownload}
            size="lg"
            className="w-full py-6 md:py-7 text-base md:text-lg font-bold success-gradient text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-0"
          >
            <Download className="h-6 w-6 mr-2 md:mr-3" />
            Descargar Transcripción Word
          </Button>

          {/* Start new button */}
          <Button
            onClick={onStartNew}
            variant="outline"
            size="lg"
            className="w-full py-5 md:py-6 text-base border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Transcribir Otro Audio
          </Button>
        </div>

        <p className="text-xs md:text-sm text-muted-foreground px-4">
          El documento se descargará automáticamente al hacer clic en el botón
        </p>
      </div>
    </div>
  );
};
