
import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, Brain, Zap, Cpu, Activity, Database, FileText, CheckCircle2, AlertCircle, RefreshCw, Hash, Wifi, WifiOff } from 'lucide-react';
import { ProcessingStatus } from '@/types/processing';
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
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number; speed: number }>>([]);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [confettiActive, setConfettiActive] = useState(false);
  const [scanLines, setScanLines] = useState<Array<{ id: number; delay: number }>>([]);

  const MAX_TIME = 15 * 60; // 15 minutos en segundos

  // Detectar redimensionamiento de ventana para confeti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manejar el confeti mejorado
  useEffect(() => {
    if (processingStatus.showConfetti && processingStatus.status === 'completed') {
      console.log('🎊 Activando confeti mejorado');
      setConfettiActive(true);
      
      // Auto-ocultar confeti después de 8 segundos
      const timer = setTimeout(() => {
        setConfettiActive(false);
        if (onHideConfetti) {
          onHideConfetti();
        }
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [processingStatus.showConfetti, processingStatus.status, onHideConfetti]);

  // Actualizar fase y progreso basado en el status
  useEffect(() => {
    setCurrentPhase(processingStatus.status as any);
    setSmartProgress(processingStatus.progress);
    
    // Progreso inteligente basado en tiempo si estamos procesando
    if (processingStatus.status === 'processing' && processingStatus.timeElapsed > 0) {
      const elapsedMinutes = processingStatus.timeElapsed / 60;
      let calculatedProgress = 25; // Progreso base después de envío
      
      if (elapsedMinutes < 5) {
        calculatedProgress = 25 + ((elapsedMinutes / 5) * 25);
      } else if (elapsedMinutes < 10) {
        calculatedProgress = 50 + (((elapsedMinutes - 5) / 5) * 25);
      } else {
        calculatedProgress = 75 + (((elapsedMinutes - 10) / 5) * 15);
      }
      
      setSmartProgress(Math.min(90, calculatedProgress));
    }
  }, [processingStatus.status, processingStatus.progress, processingStatus.timeElapsed]);

  // Generar partículas flotantes mejoradas
  useEffect(() => {
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 3 + 2
    }));
    setParticles(newParticles);

    // Líneas de escaneo
    const newScanLines = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 0.5
    }));
    setScanLines(newScanLines);
  }, []);

  // Pensamientos de IA dinámicos
  useEffect(() => {
    const thoughts = {
      sending: [
        'Inicializando protocolos de transferencia...',
        'Estableciendo conexión cuántica...',
        'Preparando matriz de datos...',
        'Activando compresores neurales...',
      ],
      processing: [
        'Analizando patrones de datos...',
        'Ejecutando algoritmos de deep learning...',
        'Procesando información con redes neuronales...',
        'Sintetizando conocimiento empresarial...',
        'Generando insights avanzados...',
        'Optimizando resultados con IA...',
        'Compilando informe inteligente...',
        'Calibrando sistemas de análisis...',
      ],
      completed: [
        '¡Procesamiento cuántico completado!',
        'Datos transformados exitosamente',
        '¡Sistema IA operativo al 100%!',
      ],
      timeout: [
        'Límite de procesamiento alcanzado',
        'Sistema en estado de espera',
      ],
      error: [
        'Error en matriz de procesamiento',
        'Reinicializando sistemas...',
      ]
    };

    const currentThoughts = thoughts[currentPhase] || thoughts.processing;
    
    const thoughtTimer = setInterval(() => {
      const randomThought = currentThoughts[Math.floor(Math.random() * currentThoughts.length)];
      setAiThoughts(randomThought);
    }, 2500);

    return () => clearInterval(thoughtTimer);
  }, [currentPhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      case 'sending': return 'Transmitiendo datos al núcleo de procesamiento...';
      case 'processing': return 'IA procesando información empresarial...';
      case 'completed': return '¡Procesamiento completado exitosamente!';
      case 'timeout': return 'Tiempo límite alcanzado - Puedes iniciar nuevo trabajo';
      case 'error': return 'Error en el procesamiento - Reintentar disponible';
      default: return 'Procesando con IA avanzada...';
    }
  };

  // Renderizar confeti mejorado
  const renderConfetti = () => {
    if (confettiActive || processingStatus.showConfetti) {
      return (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
          colors={['#14b8a6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316']}
          initialVelocityY={20}
          wind={0.01}
        />
      );
    }
    return null;
  };

  // Renderizar vista de ERROR con botón reintentar
  if (currentPhase === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-900/10 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          <div className="relative mb-12">
            <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center relative overflow-hidden border-2 border-red-500/50">
              <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping"></div>
              <div className="absolute inset-4 rounded-full border-2 border-red-500/30 animate-ping" style={{ animationDelay: '0.5s' }}></div>
              <div className="relative z-10 animate-pulse">
                <AlertCircle className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-white mb-2 font-mono">
              ERROR EN <span className="text-red-400 animate-pulse">PROCESAMIENTO</span>
            </h1>
            <div className="inline-flex items-center gap-2 bg-red-500/20 px-6 py-3 rounded-full border border-red-500/30 backdrop-blur-sm">
              <AlertCircle className="h-5 w-5 text-red-400 animate-pulse" />
              <span className="text-red-400 font-mono text-lg">
                PROCESAMIENTO FALLIDO
              </span>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 max-w-lg mb-6">
              <p className="text-red-300 font-mono text-xl mb-4">
                Proyecto: "{projectName}"
              </p>
              
              <p className="text-red-300 text-sm mb-4">
                {processingStatus.message || 'Ocurrió un error durante el procesamiento de los archivos.'}
              </p>
              <p className="text-cyan-300 text-sm">
                Puedes reintentar el procesamiento cuando gustes.
              </p>
            </div>

            {onStartNew && (
              <Button
                onClick={onStartNew}
                className="bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 text-white px-10 py-4 rounded-lg font-bold text-lg transition-all duration-300 flex items-center gap-3 mx-auto shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105"
              >
                <RefreshCw className="h-6 w-6 animate-spin" style={{ animationDuration: '2s' }} />
                Reintentar Procesamiento
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Renderizar vista de timeout
  if (currentPhase === 'timeout') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-900/10 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          <div className="relative mb-12">
            <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-r from-red-400 to-orange-400 flex items-center justify-center relative overflow-hidden border-2 border-red-500/50 opacity-90">
              <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping"></div>
              <div className="relative z-10">
                <Clock className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

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

  // Vista de éxito completado con confeti mejorado
  if (currentPhase === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-900/10 to-slate-900 relative overflow-hidden">
        {renderConfetti()}
        
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          <div className="relative mb-12">
            <div className="w-52 h-52 mx-auto rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center relative overflow-hidden border-2 border-green-500/50 animate-pulse">
              <div className="absolute inset-0 rounded-full border-2 border-green-500/20 animate-ping"></div>
              <div className="absolute inset-4 rounded-full border-2 border-green-500/30 animate-ping" style={{ animationDelay: '0.5s' }}></div>
              <div className="relative z-10 animate-bounce">
                <CheckCircle2 className="h-20 w-20 text-white" />
              </div>
            </div>
          </div>

          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-5xl font-bold text-white mb-4 font-mono animate-scale-in">
              ¡PROCESAMIENTO <span className="text-green-400 animate-pulse">COMPLETADO!</span>
            </h1>
            <div className="inline-flex items-center gap-2 bg-green-500/20 px-8 py-4 rounded-full border border-green-500/30 backdrop-blur-sm animate-bounce">
              <CheckCircle2 className="h-6 w-6 text-green-400 animate-pulse" />
              <span className="text-green-400 font-mono text-xl">
                INFORME IA GENERADO EXITOSAMENTE
              </span>
            </div>
          </div>

          <div className="text-center mb-8 animate-fade-in">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-8 max-w-2xl">
              <p className="text-green-300 font-mono text-xl mb-4 animate-pulse">
                Proyecto: "{projectName}"
              </p>
              
              <p className="text-cyan-300 text-lg mb-4">
                Tu archivo ha sido guardado automáticamente en "Archivos Guardados".
              </p>
              <div className="mt-6 text-green-400 font-mono text-lg animate-pulse">
                🎉 ¡Celebremos este éxito! 🎉
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de procesamiento normal MEJORADA
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Matriz de código de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.2)_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse"></div>
      </div>

      {/* Líneas de escaneo */}
      {scanLines.map(line => (
        <div
          key={line.id}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-sierra-teal to-transparent opacity-60 animate-pulse"
          style={{
            top: `${10 + (line.id * 10)}%`,
            animationDelay: `${line.delay}s`,
            animationDuration: '3s'
          }}
        />
      ))}

      {/* Partículas flotantes mejoradas */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute bg-sierra-teal/40 rounded-full animate-pulse`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.speed}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Cerebro IA Central MEGA MEJORADO */}
        <div className="relative mb-16">
          {/* Ondas de energía expansivas */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 rounded-full border-2 border-sierra-teal/20 animate-ping" style={{ animationDuration: '4s' }}></div>
            <div className="absolute w-64 h-64 rounded-full border-2 border-cyan-400/30 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
            <div className="absolute w-48 h-48 rounded-full border-2 border-blue-400/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '2s' }}></div>
          </div>
          
          {/* Cerebro principal más grande */}
          <div className={`w-56 h-56 mx-auto rounded-full bg-gradient-to-r ${getPhaseColor()} flex items-center justify-center relative overflow-hidden border-4 border-sierra-teal/60 shadow-2xl shadow-sierra-teal/50`}>
            {/* Efectos holográficos internos */}
            <div className="absolute inset-0 rounded-full">
              <div className="absolute inset-4 rounded-full border-2 border-white/20 animate-spin" style={{ animationDuration: '8s' }}></div>
              <div className="absolute inset-8 rounded-full border-2 border-white/30 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
              <div className="absolute inset-12 rounded-full border-2 border-white/40 animate-spin" style={{ animationDuration: '4s' }}></div>
            </div>
            
            {/* Resplandor interno */}
            <div className="absolute inset-0 bg-gradient-to-r from-sierra-teal/30 via-transparent to-cyan-400/30 rounded-full animate-pulse"></div>
            
            {/* Icono central rotando */}
            <div className="relative z-10 animate-spin" style={{ animationDuration: '10s' }}>
              <Brain className="h-24 w-24 text-white drop-shadow-2xl" />
            </div>
          </div>
          
          {/* Elementos orbitales mejorados */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 -translate-y-4">
            <div className="animate-bounce" style={{ animationDuration: '3s' }}>
              <Cpu className="h-8 w-8 text-cyan-400 drop-shadow-lg" />
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 translate-y-4">
            <div className="animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>
              <Database className="h-8 w-8 text-sierra-teal drop-shadow-lg" />
            </div>
          </div>
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 -translate-x-12">
            <div className="animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}>
              <Activity className="h-8 w-8 text-emerald-400 drop-shadow-lg" />
            </div>
          </div>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 translate-x-12">
            <div className="animate-bounce" style={{ animationDuration: '3s', animationDelay: '1.5s' }}>
              <FileText className="h-8 w-8 text-blue-400 drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* Título mejorado */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 font-mono bg-gradient-to-r from-sierra-teal via-cyan-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
            SIERRA IA QUANTUM
          </h1>
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-sierra-teal/20 to-cyan-400/20 px-8 py-4 rounded-full border border-sierra-teal/40 backdrop-blur-sm shadow-2xl shadow-sierra-teal/30">
            <Sparkles className="h-6 w-6 text-sierra-teal animate-pulse" />
            <span className="text-sierra-teal font-mono text-xl font-bold">
              {projectName}
            </span>
            <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
          </div>
        </div>

        {/* Panel de pensamientos IA mejorado */}
        <div className="mb-12 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-sierra-teal/10 to-cyan-400/10 rounded-2xl blur-lg"></div>
            <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-sm border-2 border-sierra-teal/40 rounded-2xl p-8 max-w-2xl shadow-2xl shadow-sierra-teal/30">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Brain className="h-6 w-6 text-sierra-teal animate-pulse" />
                <span className="text-sierra-teal font-mono text-lg font-bold tracking-wider">NEURAL NETWORK STATUS</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              <p className="text-cyan-300 font-mono text-xl mb-3 min-h-[1.5rem]">{aiThoughts}</p>
              <p className="text-sierra-teal text-lg font-medium">{getPhaseMessage()}</p>
              
              {/* Indicador de transmisión de datos */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <Wifi className="h-5 w-5 text-green-400 animate-pulse" />
                <span className="text-green-400 text-sm font-mono">CONEXIÓN ESTABLE • TRANSMITIENDO DATOS</span>
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-1 h-4 bg-green-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso hexagonal mejorada */}
        <div className="w-full max-w-3xl mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-sierra-teal/10 to-cyan-400/10 rounded-2xl blur-lg"></div>
            <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-sm border-2 border-sierra-teal/40 rounded-2xl p-8 shadow-2xl shadow-sierra-teal/30">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sierra-teal font-mono text-xl font-bold tracking-wider">QUANTUM PROGRESS</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono text-3xl font-bold">{Math.round(smartProgress)}%</span>
                  <div className="w-3 h-3 bg-sierra-teal rounded-full animate-pulse"></div>
                </div>
              </div>
              
              {/* Barra de progreso con efectos */}
              <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden border-2 border-sierra-teal/30 shadow-inner">
                <div 
                  className={`h-full bg-gradient-to-r ${getPhaseColor()} transition-all duration-1000 relative overflow-hidden`}
                  style={{ width: `${smartProgress}%` }}
                >
                  {/* Efectos de energía en la barra */}
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" 
                       style={{ animationDuration: '2s' }}></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-white/60 animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/60 animate-pulse"></div>
                </div>
              </div>
              
              {/* Chips de estado de fases */}
              <div className="mt-6 flex justify-center gap-3">
                {['ENVIANDO', 'PROCESANDO', 'ANALIZANDO', 'COMPILANDO'].map((phase, index) => {
                  const isActive = smartProgress >= (index + 1) * 25;
                  return (
                    <div 
                      key={phase}
                      className={`px-4 py-2 rounded-full border text-xs font-mono font-bold transition-all duration-500 ${
                        isActive 
                          ? 'bg-sierra-teal/20 border-sierra-teal text-sierra-teal animate-pulse' 
                          : 'bg-slate-800/50 border-slate-600 text-slate-400'
                      }`}
                    >
                      {phase}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de información final */}
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-xl blur-lg"></div>
            <div className="relative bg-slate-900/40 backdrop-blur-sm border border-sierra-teal/20 rounded-xl p-6 max-w-2xl">
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 animate-pulse" />
                <span className="text-green-400 font-mono text-sm font-bold">SISTEMA OPERATIVO • PROCESAMIENTO ACTIVO</span>
              </div>
              <p className="text-cyan-300/80 font-mono text-sm leading-relaxed">
                La IA está procesando tus archivos organizados por área empresarial. 
                <br />
                <span className="text-sierra-teal font-bold">¡Mantén esta ventana abierta para garantizar la conexión!</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturisticAIProcessingScreen;
