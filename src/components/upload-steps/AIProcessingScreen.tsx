
import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, Brain, Zap, Hash } from 'lucide-react';
import { ProcessingStatus } from '@/hooks/useMultiStepUpload';

interface AIProcessingScreenProps {
  processingStatus: ProcessingStatus;
  projectName: string;
}

const AIProcessingScreen = ({ processingStatus, projectName }: AIProcessingScreenProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = () => {
    switch (processingStatus.status) {
      case 'sending':
        return 'Subiendo archivos al servidor';
      case 'processing':
        return 'IA analizando y procesando datos';
      default:
        return processingStatus.message || 'Procesando';
    }
  };

  const getStatusIcon = () => {
    switch (processingStatus.status) {
      case 'sending':
        return <Zap className="h-8 w-8 text-sierra-teal animate-bounce" />;
      case 'processing':
        return <Brain className="h-8 w-8 text-sierra-teal animate-pulse" />;
      default:
        return <Sparkles className="h-8 w-8 text-sierra-teal animate-spin" />;
    }
  };

  return (
    <div className="text-center max-w-2xl mx-auto py-12">
      {/* AI Animation */}
      <div className="relative mb-12">
        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-sierra-teal/20 to-sierra-teal/40 flex items-center justify-center relative overflow-hidden">
          {/* Pulsing background */}
          <div className="absolute inset-0 rounded-full bg-sierra-teal/10 animate-ping"></div>
          <div className="absolute inset-4 rounded-full bg-sierra-teal/20 animate-pulse"></div>
          
          {/* Icon */}
          <div className="relative z-10">
            {getStatusIcon()}
          </div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute top-8 left-8 w-2 h-2 bg-sierra-teal rounded-full animate-ping delay-100"></div>
        <div className="absolute top-16 right-12 w-1 h-1 bg-sierra-teal rounded-full animate-ping delay-300"></div>
        <div className="absolute bottom-12 left-16 w-1.5 h-1.5 bg-sierra-teal rounded-full animate-ping delay-500"></div>
        <div className="absolute bottom-8 right-8 w-1 h-1 bg-sierra-teal rounded-full animate-ping delay-700"></div>
      </div>

      {/* Project Info */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-sierra-teal mb-2">
          Generando Informe IA
        </h2>
        <p className="text-xl text-sierra-gray mb-4">
          Proyecto: <span className="font-semibold text-sierra-teal">{projectName}</span>
        </p>
        
        {/* Request ID Display - Formato Simple */}
        {processingStatus.requestId && (
          <div className="bg-sierra-teal/10 rounded-lg p-4 mb-4 border border-sierra-teal/20">
            <div className="flex items-center justify-center gap-3 text-lg">
              <Hash className="h-5 w-5 text-sierra-teal" />
              <span className="font-mono font-bold text-sierra-teal text-xl">
                {processingStatus.requestId}
              </span>
            </div>
            <p className="text-sm text-sierra-gray mt-1">
              ID de Solicitud - Para soporte y seguimiento
            </p>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mb-8">
        <p className="text-lg text-sierra-teal font-medium mb-4">
          {getStatusMessage()}{dots}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-sierra-teal/20 rounded-full h-3 mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sierra-teal to-sierra-teal/80 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${processingStatus.progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-sierra-gray">
          <span>{processingStatus.progress}% completado</span>
          <span>{formatTime(processingStatus.timeElapsed)} transcurridos</span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-sierra-teal/10 rounded-2xl p-6 mb-8 border border-sierra-teal/20">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Clock className="h-5 w-5 text-sierra-teal" />
          <span className="text-sierra-teal font-medium">Tiempo de Procesamiento</span>
        </div>
        <div className="text-3xl font-mono font-bold text-sierra-teal">
          {formatTime(processingStatus.timeElapsed)}
        </div>
        <p className="text-sm text-sierra-gray mt-2">
          Tiempo máximo: 15:00 minutos
        </p>
      </div>

      {/* Processing Steps */}
      <div className="space-y-3 text-left max-w-md mx-auto">
        <div className={`flex items-center gap-3 transition-opacity ${
          processingStatus.progress >= 10 ? 'opacity-100' : 'opacity-50'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            processingStatus.progress >= 10 ? 'bg-sierra-teal animate-pulse' : 'bg-sierra-teal/30'
          }`}></div>
          <span className="text-sierra-gray">Archivos recibidos</span>
        </div>
        
        <div className={`flex items-center gap-3 transition-opacity ${
          processingStatus.progress >= 30 ? 'opacity-100' : 'opacity-50'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            processingStatus.progress >= 30 ? 'bg-sierra-teal animate-pulse' : 'bg-sierra-teal/30'
          }`}></div>
          <span className="text-sierra-gray">Análisis de contenido</span>
        </div>
        
        <div className={`flex items-center gap-3 transition-opacity ${
          processingStatus.progress >= 60 ? 'opacity-100' : 'opacity-50'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            processingStatus.progress >= 60 ? 'bg-sierra-teal animate-pulse' : 'bg-sierra-teal/30'
          }`}></div>
          <span className="text-sierra-gray">Procesamiento IA</span>
        </div>
        
        <div className={`flex items-center gap-3 transition-opacity ${
          processingStatus.progress >= 80 ? 'opacity-100' : 'opacity-50'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            processingStatus.progress >= 80 ? 'bg-sierra-teal animate-pulse' : 'bg-sierra-teal/30'
          }`}></div>
          <span className="text-sierra-gray">Generando informe</span>
        </div>
        
        <div className={`flex items-center gap-3 transition-opacity ${
          processingStatus.progress >= 100 ? 'opacity-100' : 'opacity-50'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            processingStatus.progress >= 100 ? 'bg-sierra-teal animate-pulse' : 'bg-sierra-teal/30'
          }`}></div>
          <span className="text-sierra-gray">Finalizando</span>
        </div>
      </div>
    </div>
  );
};

export default AIProcessingScreen;
