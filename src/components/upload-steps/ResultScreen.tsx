import { CheckCircle, FileEdit, ArrowRight, RotateCcw, Presentation, Sparkles } from 'lucide-react';
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
        {/* Success Icon with enhanced animation */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-sierra-bright/30 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-sierra-teal to-sierra-bright flex items-center justify-center shadow-2xl">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        {/* Enhanced Success Message */}
        <div className="space-y-4">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-sierra-teal to-sierra-bright bg-clip-text text-transparent">
            ¡Análisis Completado!
          </h2>
          <p className="text-xl text-muted-foreground">
            Se generaron <span className="font-bold text-sierra-teal">2 documentos</span> para tu proyecto
          </p>
          <p className="text-lg font-semibold text-foreground">
            "{projectTitle}"
          </p>
        </div>

        {/* Document Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-sierra-teal/10 border border-sierra-teal/30 rounded-xl p-5 space-y-3">
            <FileEdit className="w-10 h-10 text-sierra-teal mx-auto" />
            <h3 className="font-bold text-sierra-teal">Informe Word</h3>
            <p className="text-sm text-muted-foreground">
              Documento editable con análisis detallado
            </p>
          </div>
          
          <div className="bg-purple-100/50 dark:bg-purple-900/20 border border-purple-300/50 dark:border-purple-700/50 rounded-xl p-5 space-y-3">
            <Presentation className="w-10 h-10 text-purple-600 dark:text-purple-400 mx-auto" />
            <h3 className="font-bold text-purple-600 dark:text-purple-400">Presentación PPT</h3>
            <p className="text-sm text-muted-foreground">
              Slides listas para presentar
            </p>
          </div>
        </div>

        {/* More prominent action buttons */}
        <div className="flex flex-col gap-4 pt-4">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-sierra-teal to-sierra-bright hover:opacity-90 text-white text-lg py-6 shadow-xl hover:shadow-2xl transition-all"
            onClick={() => navigate('/saved-files')}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Ver Mis Análisis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2 border-sierra-teal/30 hover:bg-sierra-teal/5 py-6"
            onClick={onStartNew}
          >
            <RotateCcw className="w-5 h-5" />
            Procesar Otro Proyecto
          </Button>
        </div>

        {/* Footer Info */}
        <p className="text-xs text-muted-foreground pt-2">
          Tus documentos permanecerán guardados hasta que decidas eliminarlos
        </p>
      </Card>
    </div>
  );
};