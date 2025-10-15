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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-900/10 to-slate-900 relative overflow-hidden flex items-center justify-center p-8">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-2xl">
        {/* Success icon */}
        <div className="relative mb-8">
          <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center animate-pulse">
            <div className="absolute inset-0 rounded-full border-2 border-green-500/20 animate-ping" />
            <CheckCircle2 className="h-20 w-20 text-white relative z-10 animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <div className="animate-fade-in">
          <h1 className="text-5xl font-bold text-white mb-4 font-mono">
            ¡TRANSCRIPCIÓN <span className="text-green-400 animate-pulse">COMPLETADA!</span>
          </h1>
          <div className="inline-flex items-center gap-2 bg-green-500/20 px-6 py-3 rounded-full border border-green-500/30 backdrop-blur-sm">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-mono text-lg">
              DOCUMENTO WORD GENERADO
            </span>
          </div>
        </div>

        {/* File info */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-8 space-y-6">
          <div className="flex items-center justify-center gap-3 text-green-300">
            <FileText className="h-6 w-6" />
            <p className="font-mono text-lg">
              Archivo original: <span className="text-white">{originalFileName}</span>
            </p>
          </div>

          <div className="text-cyan-300 text-sm">
            Tiempo de procesamiento: {formatTime(processingTime)}
          </div>

          {/* Download button */}
          <Button
            onClick={handleDownload}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-6 text-lg font-bold shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-300"
          >
            <Download className="h-6 w-6 mr-2" />
            Descargar Transcripción Word
          </Button>

          {/* Start new button */}
          <Button
            onClick={onStartNew}
            variant="outline"
            className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 py-4"
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
