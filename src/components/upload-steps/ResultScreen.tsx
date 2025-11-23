import { CheckCircle, FileText, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface ResultScreenProps {
  projectTitle: string;
  onStartNew: () => void;
}

export const ResultScreen = ({ projectTitle, onStartNew }: ResultScreenProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-sierra-teal/5 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8 space-y-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-sierra-bright/20 rounded-full blur-xl animate-pulse" />
            <CheckCircle className="w-24 h-24 text-sierra-bright relative z-10" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-foreground">
            ¡Procesamiento Completado con Éxito!
          </h2>
          <p className="text-lg text-muted-foreground">
            Tu informe <span className="font-semibold text-sierra-teal">"{projectTitle}"</span> ha sido generado y guardado
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-sierra-teal/5 border border-sierra-teal/20 rounded-lg p-6 space-y-3">
          <div className="flex items-center justify-center gap-3 text-sierra-teal">
            <FileText className="w-6 h-6" />
            <p className="font-medium text-lg">Documento listo para editar</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Encontrarás tu proyecto en <span className="font-semibold">Archivos Guardados</span> donde podrás:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-sierra-bright mt-0.5">•</span>
              <span>Abrir y editar el informe tipo Microsoft Word</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sierra-bright mt-0.5">•</span>
              <span>Crear presentación PowerPoint del contenido</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sierra-bright mt-0.5">•</span>
              <span>Descargar en PDF con formato profesional</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            size="lg"
            className="bg-sierra-teal hover:bg-sierra-teal/90 text-white gap-2 shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate('/saved-files')}
          >
            Ver Archivos Guardados
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="gap-2 border-sierra-teal/30 hover:bg-sierra-teal/5"
            onClick={onStartNew}
          >
            <RotateCcw className="w-5 h-5" />
            Procesar Nuevo Proyecto
          </Button>
        </div>

        {/* Footer Info */}
        <p className="text-xs text-muted-foreground pt-4">
          El documento permanecerá guardado hasta que decidas eliminarlo
        </p>
      </Card>
    </div>
  );
};
