
import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, Brain, Zap, Hash, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { ProcessingStatus } from '@/types/processing';
import { Button } from '@/components/ui/button';

interface AIProcessingScreenProps {
  processingStatus: ProcessingStatus;
  projectName: string;
  onRetry?: () => void;
}

const AIProcessingScreen = ({ processingStatus, projectName, onRetry }: AIProcessingScreenProps) => {
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
        return 'Preparando y enviando archivos al servidor';
      case 'processing':
        return 'Esperando respuesta del servidor (máximo 15 minutos)';
      case 'timeout':
        return 'El servidor no respondió a tiempo';
      case 'error':
        return processingStatus.message || 'Error durante el procesamiento';
      case 'completed':
        return '¡Procesamiento completado exitosamente!';
      default:
        return processingStatus.message || 'Procesando';
    }
  };

  const getStatusIcon = () => {
    switch (processingStatus.status) {
      case 'sending':
        return <Zap className="h-8 w-8 text-sierra-teal animate-bounce" />;
      case 'processing':
        return <Wifi className="h-8 w-8 text-sierra-teal animate-pulse" />;
      case 'completed':
        return <Sparkles className="h-8 w-8 text-green-500 animate-pulse" />;
      case 'timeout':
        return <WifiOff className="h-8 w-8 text-orange-500" />;
      case 'error':
        return <WifiOff className="h-8 w-8 text-red-500" />;
      default:
        return <Brain className="h-8 w-8 text-sierra-teal animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (processingStatus.status) {
      case 'completed':
        return 'text-green-500';
      case 'timeout':
        return 'text-orange-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-sierra-teal';
    }
  };

  return (
    <div className="text-center max-w-2xl mx-auto py-12">
      {/* Status Animation */}
      <div className="relative mb-12">
        <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-sierra-teal/20 to-sierra-teal/40 flex items-center justify-center relative overflow-hidden ${
          processingStatus.status === 'completed' ? 'from-green-500/20 to-green-500/40' :
          processingStatus.status === 'timeout' ? 'from-orange-500/20 to-orange-500/40' :
          processingStatus.status === 'error' ? 'from-red-500/20 to-red-500/40' : ''
        }`}>
          {/* Pulsing background */}
          {processingStatus.status === 'processing' && (
            <>
              <div className="absolute inset-0 rounded-full bg-sierra-teal/10 animate-ping"></div>
              <div className="absolute inset-4 rounded-full bg-sierra-teal/20 animate-pulse"></div>
            </>
          )}
          
          {/* Icon */}
          <div className="relative z-10">
            {getStatusIcon()}
          </div>
        </div>
        
        {/* Floating particles - solo durante procesamiento */}
        {processingStatus.status === 'processing' && (
          <>
            <div className="absolute top-8 left-8 w-2 h-2 bg-sierra-teal rounded-full animate-ping delay-100"></div>
            <div className="absolute top-16 right-12 w-1 h-1 bg-sierra-teal rounded-full animate-ping delay-300"></div>
            <div className="absolute bottom-12 left-16 w-1.5 h-1.5 bg-sierra-teal rounded-full animate-ping delay-500"></div>
            <div className="absolute bottom-8 right-8 w-1 h-1 bg-sierra-teal rounded-full animate-ping delay-700"></div>
          </>
        )}
      </div>

      {/* Project Info */}
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${getStatusColor()}`}>
          {processingStatus.status === 'completed' ? '¡Procesamiento Completado!' :
           processingStatus.status === 'timeout' ? 'Tiempo Límite Alcanzado' :
           processingStatus.status === 'error' ? 'Error en el Procesamiento' :
           'Generando Informe IA'}
        </h2>
        <p className="text-xl text-sierra-gray mb-4">
          Proyecto: <span className="font-semibold text-sierra-teal">{projectName}</span>
        </p>
        
        {/* Request ID Display */}
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

      {/* Status Message */}
      <div className="mb-8">
        <p className={`text-lg font-medium mb-4 ${getStatusColor()}`}>
          {getStatusMessage()}{processingStatus.status === 'processing' ? dots : ''}
        </p>
        
        {/* Progress Bar - solo si no es error/timeout/completed */}
        {!['error', 'timeout', 'completed'].includes(processingStatus.status) && (
          <>
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
          </>
        )}
      </div>

      {/* Timer Display */}
      <div className={`rounded-2xl p-6 mb-8 border ${
        processingStatus.status === 'completed' ? 'bg-green-500/10 border-green-500/20' :
        processingStatus.status === 'timeout' ? 'bg-orange-500/10 border-orange-500/20' :
        processingStatus.status === 'error' ? 'bg-red-500/10 border-red-500/20' :
        'bg-sierra-teal/10 border-sierra-teal/20'
      }`}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Clock className={`h-5 w-5 ${getStatusColor()}`} />
          <span className={`font-medium ${getStatusColor()}`}>
            {processingStatus.status === 'completed' ? 'Tiempo Total' : 'Tiempo Transcurrido'}
          </span>
        </div>
        <div className={`text-3xl font-mono font-bold ${getStatusColor()}`}>
          {formatTime(processingStatus.timeElapsed)}
        </div>
        {processingStatus.status === 'processing' && (
          <p className="text-sm text-sierra-gray mt-2">
            Tiempo máximo: 15:00 minutos
          </p>
        )}
      </div>

      {/* Retry Button - solo para timeout/error */}
      {(['timeout', 'error'].includes(processingStatus.status) && onRetry) && (
        <div className="mb-8">
          <Button 
            onClick={onRetry}
            className="bg-sierra-teal hover:bg-sierra-teal/90 text-white px-8 py-3 text-lg"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Reintentar Procesamiento
          </Button>
        </div>
      )}

      {/* Processing Steps - solo durante procesamiento activo */}
      {processingStatus.status === 'processing' && (
        <div className="space-y-3 text-left max-w-md mx-auto">
          <div className={`flex items-center gap-3 transition-opacity ${
            processingStatus.progress >= 5 ? 'opacity-100' : 'opacity-50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              processingStatus.progress >= 5 ? 'bg-sierra-teal animate-pulse' : 'bg-sierra-teal/30'
            }`}></div>
            <span className="text-sierra-gray">Archivos enviados al servidor</span>
          </div>
          
          <div className={`flex items-center gap-3 transition-opacity ${
            processingStatus.progress >= 20 ? 'opacity-100' : 'opacity-50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              processingStatus.progress >= 20 ? 'bg-sierra-teal animate-pulse' : 'bg-sierra-teal/30'
            }`}></div>
            <span className="text-sierra-gray">Servidor procesando archivos</span>
          </div>
          
          <div className={`flex items-center gap-3 transition-opacity ${
            processingStatus.progress >= 50 ? 'opacity-100' : 'opacity-50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              processingStatus.progress >= 50 ? 'bg-sierra-teal animate-pulse' : 'bg-sierra-teal/30'
            }`}></div>
            <span className="text-sierra-gray">Análisis IA en progreso</span>
          </div>
          
          <div className={`flex items-center gap-3 transition-opacity ${
            processingStatus.progress >= 80 ? 'opacity-100' : 'opacity-50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              processingStatus.progress >= 80 ? 'bg-sierra-teal animate-pulse' : 'bg-sierra-teal/30'
            }`}></div>
            <span className="text-sierra-gray">Generando informe final</span>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {processingStatus.status === 'processing' && (
        <div className="mt-8 bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
          <p className="text-blue-400 text-sm">
            <strong>Conexión estable:</strong> Esperando respuesta directa del servidor. 
            El procesamiento puede tardar hasta 15 minutos dependiendo de la cantidad de archivos.
          </p>
        </div>
      )}

      {processingStatus.status === 'timeout' && (
        <div className="mt-8 bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
          <p className="text-orange-400 text-sm">
            <strong>Tiempo agotado:</strong> El servidor no respondió en 15 minutos. 
            Esto puede deberse a una alta carga de trabajo. Puedes intentar nuevamente.
          </p>
        </div>
      )}

      {processingStatus.status === 'error' && (
        <div className="mt-8 bg-red-500/10 rounded-lg p-4 border border-red-500/20">
          <p className="text-red-400 text-sm">
            <strong>Error de conexión:</strong> Hubo un problema con el servidor. 
            Verifica tu conexión a internet e intenta nuevamente.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIProcessingScreen;
