
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, RotateCcw, ExternalLink, Sparkles } from 'lucide-react';
import { ProcessingStatus } from '@/hooks/useMultiStepUpload';
import { useToast } from '@/hooks/use-toast';

interface ResultScreenProps {
  processingStatus: ProcessingStatus;
  onStartNew: () => void;
}

const ResultScreen = ({ processingStatus, onStartNew }: ResultScreenProps) => {
  const { toast } = useToast();

  const handleDownload = () => {
    if (processingStatus.resultUrl) {
      if (processingStatus.resultUrl.includes('drive.google.com')) {
        // Open Google Drive link in new tab
        window.open(processingStatus.resultUrl, '_blank');
        toast({
          title: "Enlace Abierto",
          description: "Se ha abierto el enlace a Google Drive en una nueva pestaña.",
        });
      } else if (processingStatus.resultUrl.startsWith('blob:')) {
        // Direct download for blob URLs
        const link = document.createElement('a');
        link.href = processingStatus.resultUrl;
        link.download = 'informe-ia-procesado.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "Descarga Iniciada",
          description: "Tu informe IA se está descargando.",
        });
      } else {
        // Try to open as link
        window.open(processingStatus.resultUrl, '_blank');
        toast({
          title: "Enlace Abierto",
          description: "Se ha abierto el enlace del archivo procesado.",
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="text-center max-w-2xl mx-auto py-12">
      {/* Success Animation */}
      <div className="relative mb-12">
        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-green-400/20 to-sierra-teal/40 flex items-center justify-center relative overflow-hidden">
          {/* Success pulse */}
          <div className="absolute inset-0 rounded-full bg-green-400/10 animate-ping"></div>
          
          {/* Success icon */}
          <div className="relative z-10">
            <CheckCircle className="h-16 w-16 text-sierra-teal" />
          </div>
        </div>
        
        {/* Success particles */}
        <div className="absolute top-4 left-8 text-2xl animate-bounce delay-100">✨</div>
        <div className="absolute top-8 right-12 text-xl animate-bounce delay-300">🎉</div>
        <div className="absolute bottom-12 left-16 text-lg animate-bounce delay-500">⭐</div>
        <div className="absolute bottom-4 right-8 text-2xl animate-bounce delay-700">🚀</div>
      </div>

      {/* Success Message */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-sierra-teal mb-4">
          ¡Informe IA Completado! 
        </h2>
        <div className="inline-flex items-center gap-2 bg-sierra-teal/10 px-4 py-2 rounded-full mb-4">
          <Sparkles className="h-5 w-5 text-sierra-teal" />
          <span className="text-sierra-teal font-medium">ÉXITO</span>
        </div>
        <p className="text-xl text-sierra-gray mb-6">
          Tu informe ha sido procesado con inteligencia artificial y está listo para descargar.
        </p>
      </div>

      {/* Processing Stats */}
      <div className="bg-gradient-to-r from-sierra-teal/10 to-sierra-teal/5 rounded-2xl p-6 mb-8 border border-sierra-teal/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-sierra-teal">
              {formatTime(processingStatus.timeElapsed)}
            </div>
            <div className="text-sm text-sierra-gray">Tiempo de procesamiento</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sierra-teal">100%</div>
            <div className="text-sm text-sierra-gray">Completado</div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {processingStatus.message && (
        <p className="text-sierra-teal font-medium mb-8 bg-sierra-teal/5 rounded-lg p-4">
          {processingStatus.message}
        </p>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {processingStatus.resultUrl ? (
          <Button
            onClick={handleDownload}
            size="lg"
            className="sierra-gradient hover:opacity-90 transition-all duration-300 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 w-full md:w-auto"
          >
            <Download className="mr-2 h-5 w-5" />
            {processingStatus.resultUrl.includes('drive.google.com') ? 'Abrir en Google Drive' : 'Descargar Informe IA'}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800">
              Tu informe está siendo finalizado. El archivo se ha guardado automáticamente en "Archivos Guardados".
            </p>
          </div>
        )}
        
        <div>
          <Button
            variant="outline"
            onClick={onStartNew}
            size="lg"
            className="px-6 py-3 border-sierra-teal text-sierra-teal hover:bg-sierra-teal hover:text-white"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Procesar Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center">
        <p className="text-sm text-sierra-gray/70">
          Tu informe también se guarda automáticamente en la sección "Archivos Guardados"
        </p>
      </div>
    </div>
  );
};

export default ResultScreen;
