import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Edit3, Eye, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CompanyAnalysisReviewStepProps {
  analysis: string;
  onAnalysisChange: (newAnalysis: string) => void;
  onNext: () => void;
  onRegenerate?: () => void;
}

const CompanyAnalysisReviewStep = ({ 
  analysis, 
  onAnalysisChange, 
  onNext,
  onRegenerate 
}: CompanyAnalysisReviewStepProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState(analysis);
  
  const handleContinue = () => {
    onAnalysisChange(editedAnalysis);
    onNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full mb-4">
            <span className="text-3xl">📊</span>
            <span className="text-blue-700 font-semibold">Análisis de la Empresa</span>
          </div>
          <h2 className="text-4xl font-bold text-blue-700 mb-3">
            Resumen Ejecutivo Generado
          </h2>
          <p className="text-lg text-blue-600">
            Revisa el análisis y edítalo si es necesario antes de continuar
          </p>
        </div>

        {/* Tabs para Vista / Edición */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden">
          <Tabs value={isEditing ? "edit" : "view"} className="w-full">
            <div className="bg-gradient-to-r from-blue-100 to-teal-100 p-4 border-b border-blue-200">
              <TabsList className="bg-white/50 backdrop-blur-sm">
                <TabsTrigger 
                  value="view" 
                  onClick={() => setIsEditing(false)}
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Vista Previa
                </TabsTrigger>
                <TabsTrigger 
                  value="edit" 
                  onClick={() => setIsEditing(true)}
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="view" className="p-8 m-0">
              <div className="prose prose-lg max-w-none markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {editedAnalysis}
                </ReactMarkdown>
              </div>
            </TabsContent>
            
            <TabsContent value="edit" className="p-6 m-0">
              <div className="mb-4">
                <p className="text-sm text-blue-600 mb-2">
                  💡 Puedes editar el análisis aquí. Los cambios se guardarán automáticamente.
                </p>
              </div>
              <Textarea
                value={editedAnalysis}
                onChange={(e) => setEditedAnalysis(e.target.value)}
                rows={30}
                className="font-mono text-sm border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                placeholder="Escribe o edita el análisis aquí..."
              />
              <div className="mt-4 text-xs text-blue-500">
                {editedAnalysis.length} caracteres
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-between items-center mt-8">
          {onRegenerate && (
            <Button 
              variant="outline" 
              onClick={onRegenerate}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerar Análisis
            </Button>
          )}
          
          <div className="flex-1"></div>
          
          <Button 
            onClick={handleContinue}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Continuar al Siguiente Paso
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-blue-600">
            Este análisis se incluirá en el informe final junto con los demás archivos
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyAnalysisReviewStep;
