
import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, Brain, Zap, Cpu, Activity, Database, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ProcessingStatus } from '@/hooks/useMultiStepUpload';
import { ProcessingJob } from '@/hooks/useProcessingPersistence';
import { Button } from '@/components/ui/button';
import Confetti from 'react-confetti';

interface FuturisticAIProcessingScreenProps {
  processingStatus: ProcessingStatus;
  projectName: string;
  activeJob?: ProcessingJob | null;
  onStartNew?: () => void;
  onHideConfetti?: () => void;
}

const FuturisticAIProcessingScreen = ({ 
  processingStatus, 
  projectName, 
  activeJob,
  onStartNew,
  onHideConfetti 
}: FuturisticAIProcessingScreenProps) => {
  const [smartProgress, setSmartProgress] = useState(processingStatus.progress || 0);
  const [aiThoughts, setAiThoughts] = useState('Inicializando sistema de IA...');
  const [currentPhase, setCurrentPhase] = useState<'sending' | 'processing' | 'completed' | 'timeout' | 'error'>('sending');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const MAX_TIME = 15 * 60; // 15 minutos en segundos

  // Detectar redimensionamiento de ventana para confeti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-ocultar confeti después de 4 segundos
  useEffect(() => {
    if (processingStatus.showConfetti) {
      const timer = setTimeout(() => {
        if (onHideConfetti) {
          onHideConfetti();
        }
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [processingStatus.showConfetti, onHideConfetti]);

  // Actualizar fase y progreso basado en el status
  useEffect(() => {
    setCurrentPhase(processingStatus.status as any);
    setSmartProgress(processingStatus.progress);
    
    // Progreso inteligente basado en tiempo si estamos procesando
    if (processingStatus.status === 'processing' && processingStatus.timeElapsed > 0) {
      const elapsedMinutes = processingStatus.timeElapsed / 60;
      let calculatedProgress = 25; // Progreso base después de envío
      
      if (elapsedMinutes < 5) {
        // Primeros 5 minutos: 25% a 50%
        calculatedProgress = 25 + ((elapsedMinutes / 5) * 25);
      } else if (elapsedMinutes < 10) {
        // Minutos 5-10: 50% a 75%
        calculatedProgress = 50 + (((elapsedMinutes - 5) / 5) * 25);
      } else {
        // Minutos 10-15: 75% a 90%
        calculatedProgress = 75 + (((elapsedMinutes - 10) / 5) * 15);
      }
      
      setSmartProgress(Math.min(90, calculatedProgress));
    }
  }, [processingStatus.status, processingStatus.progress, processingStatus.timeElapsed]);

  // Generar partículas flotantes
  useEffect(() => {
    const newParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

  // Pensamientos de IA dinámicos
  useEffect(() => {
    const thoughts = {
      sending: [
        'Preparando archivos para procesamiento...',
        'Estableciendo conexión con sistemas de IA...',
        'Verificando integridad de archivos...',
      ],
      processing: [
        'Analizando estructura de documentos...',
        'Extrayendo información clave...',
        'Aplicando algoritmos de comprensión...',
        'Generando insights inteligentes...',
        'Sintetizando información compleja...',
        'Creando análisis predictivo...',
        'Compilando informe ejecutivo...',
      ],
      completed: [
        '¡Análisis completado exitosamente!',
        'Informe listo para descarga',
      ],
      timeout: [
        'Tiempo límite alcanzado',
        'Puedes iniciar un nuevo procesamiento',
      ],
      error: [
        'Error en el procesamiento',
        'Verifica los archivos e intenta nuevamente',
      ]
    };

    const currentThoughts = thoughts[currentPhase] || thoughts.processing;
    
    const thoughtTimer = setInterval(() => {
      const randomThought = currentThoughts[Math.floor(Math.random() * currentThoughts.length)];
      setAiThoughts(randomThought);
    }, 3000);

    return () => clearInterval(thoughtTimer);
  }, [currentPhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timeRemaining = Math.max(0, MAX_TIME - processingStatus.timeElapsed);
  const timeProgress = (processingStatus.timeElapsed / MAX_TIME) * 100;

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'sending': return 'from-blue-400 to-cyan-400';
      case 'processing': return 'from-sierra-teal to-cyan-400';
      case 'completed': return 'from-green-400 to-emerald-400';
      case 'timeout': return 'from-red-400 to-orange-400';
      case 'error': return 'from-red-500 to-red-400';
      default: return 'from-sierra-teal to-cyan-400';
    }
  };

  const getPhaseMessage = () => {
    switch (currentPhase) {
      case 'sending': return 'Enviando archivos al sistema...';
      case 'processing': return 'IA procesando documentos...';
      case 'completed': return '¡Procesamiento completado!';
      case 'timeout': return 'Tiempo límite alcanzado - Puedes iniciar nuevo trabajo';
      case 'error': return 'Error en el procesamiento';
      default: return 'Procesando con IA...';
    }
  };

  // Renderizar confeti si está activado
  const renderConfetti = () => {
    if (processingStatus.showConfetti) {
      return (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#14b8a6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']}
        />
      );
    }
    return null;
  };

  // Renderizar vista de timeout
  if (currentPhase === 'timeout') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-900/10 to-slate-900 relative overflow-hidden">
        {/* Grid futurista de fondo */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          {/* Icono de timeout */}
          <div className="relative mb-12">
            <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-r from-red-400 to-orange-400 flex items-center justify-center relative overflow-hidden border-2 border-red-500/50 opacity-90">
              <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping"></div>
              <div className="relative z-10">
                <Clock className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Información del timeout */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 font-mono">
              TIEMPO LÍMITE <span className="text-red-400">ALCANZADO</span>
            </h1>
            <div className="inline-flex items-center gap-2 bg-red-500/20 px-6 py-3 rounded-full border border-red-500/30 backdrop-blur-sm">
              <AlertCircle className="h-5 w-5 text-red-400 animate-pulse" />
              <span className="text-red-400 font-mono text-lg">
                15:00 MINUTOS COMPLETADOS
              </span>
            </div>
          </div>

          {/* Mensaje y botón para nuevo trabajo */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 max-w-lg mb-8">
            <div className="text-center">
              <p className="text-red-300 font-mono text-lg mb-4">
                El procesamiento ha excedido el tiempo límite de 15 minutos.
              </p>
              <p className="text-cyan-300 text-sm mb-6">
                Puedes iniciar un nuevo trabajo de procesamiento cuando gustes.
              </p>
              
              {onStartNew && (
                <Button
                  onClick={onStartNew}
                  className="bg-gradient-to-r from-sierra-teal to-cyan-500 hover:from-sierra-teal/80 hover:to-cyan-500/80 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="h-5 w-5" />
                  Iniciar Nuevo Trabajo
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de éxito completado
  if (currentPhase === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-900/10 to-slate-900 relative overflow-hidden">
        {renderConfetti()}
        
        {/* Grid futurista de fondo */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          {/* Icono de éxito */}
          <div className="relative mb-12">
            <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center relative overflow-hidden border-2 border-green-500/50">
              <div className="absolute inset-0 rounded-full border-2 border-green-500/20 animate-ping"></div>
              <div className="relative z-10">
                <CheckCircle2 className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Mensaje de éxito */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 font-mono">
              ¡PROCESAMIENTO <span className="text-green-400">COMPLETADO!</span>
            </h1>
            <div className="inline-flex items-center gap-2 bg-green-500/20 px-6 py-3 rounded-full border border-green-500/30 backdrop-blur-sm">
              <CheckCircle2 className="h-5 w-5 text-green-400 animate-pulse" />
              <span className="text-green-400 font-mono text-lg">
                INFORME IA GENERADO EXITOSAMENTE
              </span>
            </div>
          </div>

          {/* Información del proyecto y tiempo */}
          <div className="text-center mb-8">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 max-w-lg">
              <p className="text-green-300 font-mono text-lg mb-4">
                Proyecto: "{projectName}"
              </p>
              <p className="text-cyan-300 text-sm mb-4">
                Tiempo de procesamiento: {formatTime(processingStatus.timeElapsed)}
              </p>
              <p className="text-cyan-300 text-sm">
                Tu archivo ha sido guardado automáticamente en "Archivos Guardados".
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de procesamiento normal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-sierra-teal/10 to-slate-900 relative overflow-hidden">
      {/* Partículas flotantes de fondo */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-sierra-teal/30 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: '3s'
            }}
          />
        ))}
      </div>

      {/* Grid futurista de fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Cerebro IA Central */}
        <div className="relative mb-12">
          <div className={`w-40 h-40 mx-auto rounded-full bg-gradient-to-r ${getPhaseColor()} flex items-center justify-center relative overflow-hidden border-2 border-sierra-teal/50 opacity-90`}>
            {/* Ondas de energía */}
            <div className="absolute inset-0 rounded-full border-2 border-sierra-teal/20 animate-ping"></div>
            <div className="absolute inset-4 rounded-full border-2 border-sierra-teal/30 animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute inset-8 rounded-full border-2 border-sierra-teal/40 animate-ping" style={{ animationDelay: '1s' }}></div>
            
            {/* Icono central rotando */}
            <div className="relative z-10 animate-spin" style={{ animationDuration: '8s' }}>
              <Brain className="h-16 w-16 text-white" />
            </div>
          </div>
          
          {/* Elementos orbitales */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
            <Cpu className="h-6 w-6 text-cyan-400 animate-bounce" />
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4">
            <Database className="h-6 w-6 text-sierra-teal animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8">
            <Activity className="h-6 w-6 text-emerald-400 animate-bounce" style={{ animationDelay: '1s' }} />
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-8">
            <FileText className="h-6 w-6 text-blue-400 animate-bounce" style={{ animationDelay: '1.5s' }} />
          </div>
        </div>

        {/* Información del proyecto */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-mono">
            SIERRA IA <span className="text-sierra-teal">PROCESSING</span>
          </h1>
          <div className="inline-flex items-center gap-2 bg-sierra-teal/20 px-6 py-3 rounded-full border border-sierra-teal/30 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-sierra-teal animate-pulse" />
            <span className="text-sierra-teal font-mono text-lg">
              {projectName}
            </span>
          </div>
        </div>

        {/* Estado actual y pensamientos de IA */}
        <div className="mb-8 text-center">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-sierra-teal/30 rounded-xl p-6 max-w-lg">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-5 w-5 text-sierra-teal animate-pulse" />
              <span className="text-sierra-teal font-mono text-sm">AI THOUGHTS</span>
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-cyan-300 font-mono text-lg mb-2">{aiThoughts}</p>
            <p className="text-sierra-teal text-sm font-medium">{getPhaseMessage()}</p>
          </div>
        </div>

        {/* Barra de progreso principal */}
        <div className="w-full max-w-2xl mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-sierra-teal/30 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sierra-teal font-mono text-lg">PROGRESO</span>
              <span className="text-white font-mono text-2xl">{Math.round(smartProgress)}%</span>
            </div>
            
            <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden border border-sierra-teal/30">
              <div 
                className={`h-full bg-gradient-to-r ${getPhaseColor()} transition-all duration-1000 relative`}
                style={{ width: `${smartProgress}%` }}
              >
                {/* Efecto de brillo */}
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                {/* Líneas de energía */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" 
                     style={{ animationDuration: '2s' }}></div>
              </div>
            </div>
            
            {/* Mensaje de progreso */}
            <div className="mt-3 flex justify-center">
              <span className="text-xs text-sierra-teal/70 font-mono uppercase tracking-wider">
                {processingStatus.message || 'Esperando respuesta de la webhook...'}
              </span>
            </div>
          </div>
        </div>

        {/* Contadores de tiempo */}
        <div className="grid grid-cols-2 gap-6 w-full max-w-lg mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-sierra-teal/30 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-sierra-teal" />
              <span className="text-sierra-teal font-mono text-sm">TRANSCURRIDO</span>
            </div>
            <div className="text-white font-mono text-2xl">{formatTime(processingStatus.timeElapsed)}</div>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-sm border border-sierra-teal/30 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <span className="text-amber-400 font-mono text-sm">RESTANTE</span>
            </div>
            <div className="text-white font-mono text-2xl">{formatTime(timeRemaining)}</div>
          </div>
        </div>

        {/* Barra de tiempo límite */}
        <div className="w-full max-w-xl mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-400/30 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-400 font-mono text-sm">TIEMPO LÍMITE: 15:00</span>
              <span className="text-amber-400 font-mono text-sm">{Math.round(timeProgress)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-amber-400/30">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400 transition-all duration-1000"
                style={{ width: `${timeProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Mensaje de información */}
        <div className="text-center">
          <div className="bg-slate-900/30 backdrop-blur-sm border border-sierra-teal/20 rounded-xl p-4 max-w-md">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-mono text-sm">ESPERA DIRECTA</span>
            </div>
            <p className="text-cyan-300/70 font-mono text-sm">
              La app está esperando la respuesta directa de la webhook con tu archivo procesado. 
              ¡No cierres esta ventana para mantener la conexión!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturisticAIProcessingScreen;
