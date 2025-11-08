import React, { useState, useEffect } from 'react';
import { Loader2, FileText, BarChart3, TrendingUp, PieChart } from 'lucide-react';

interface CompanyAnalysisProcessingScreenProps {
  projectName: string;
}

const CompanyAnalysisProcessingScreen = ({ projectName }: CompanyAnalysisProcessingScreenProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    { text: "Analizando documentos de la empresa...", icon: FileText },
    { text: "Extrayendo información financiera...", icon: BarChart3 },
    { text: "Procesando estados de resultados...", icon: TrendingUp },
    { text: "Identificando métricas clave...", icon: PieChart },
    { text: "Generando resumen ejecutivo...", icon: FileText }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [messages.length]);

  const CurrentIcon = messages[messageIndex].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-blue-100 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-700 mb-4">
            {projectName}
          </h1>
          <p className="text-lg text-blue-600">
            Analizando información de la empresa
          </p>
        </div>

        {/* Main Animation Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-blue-200">
          {/* Spinner Central */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <Loader2 className="h-24 w-24 text-blue-600 animate-spin relative z-10" />
            </div>
          </div>

          {/* Mensaje Rotativo */}
          <div className="text-center mb-8 min-h-[80px] flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 mb-3">
              <CurrentIcon className="h-8 w-8 text-teal-600 animate-bounce" />
              <h2 className="text-2xl font-semibold text-blue-700">
                {messages[messageIndex].text}
              </h2>
            </div>
            <p className="text-sm text-blue-500">
              Este proceso puede tomar entre 30 y 120 segundos
            </p>
          </div>

          {/* Barra de Progreso Indeterminada */}
          <div className="relative h-3 bg-blue-100 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-teal-500 to-blue-500 animate-pulse"></div>
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-teal-600 rounded-full animate-progress-indeterminate"
              style={{
                animation: 'progress-indeterminate 2s ease-in-out infinite'
              }}
            ></div>
          </div>

          {/* Indicadores de Paso */}
          <div className="grid grid-cols-5 gap-4 mt-8">
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex flex-col items-center transition-all duration-300 ${
                  idx === messageIndex 
                    ? 'scale-110 opacity-100' 
                    : idx < messageIndex 
                    ? 'opacity-60' 
                    : 'opacity-30'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  idx === messageIndex 
                    ? 'bg-gradient-to-br from-blue-500 to-teal-500 text-white shadow-lg' 
                    : idx < messageIndex
                    ? 'bg-blue-200 text-blue-600'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <msg.icon className="h-5 w-5" />
                </div>
                <div className={`w-full h-1 rounded-full ${
                  idx < messageIndex 
                    ? 'bg-blue-500' 
                    : idx === messageIndex
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 animate-pulse'
                    : 'bg-gray-200'
                }`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-8 text-center">
          <p className="text-sm text-blue-600">
            💡 Estamos procesando la información financiera y operativa de tu empresa
          </p>
        </div>
      </div>

      <style>{`
        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%); width: 30%; }
          50% { transform: translateX(150%); width: 60%; }
          100% { transform: translateX(300%); width: 30%; }
        }
      `}</style>
    </div>
  );
};

export default CompanyAnalysisProcessingScreen;
