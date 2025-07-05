
import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, Brain, Zap, Cpu, Activity, Database, FileText } from 'lucide-react';
import { ProcessingStatus } from '@/hooks/useMultiStepUpload';
import { ProcessingJob } from '@/hooks/useProcessingPersistence';

interface FuturisticAIProcessingScreenProps {
  processingStatus: ProcessingStatus;
  projectName: string;
  activeJob?: ProcessingJob | null;
}

const FuturisticAIProcessingScreen = ({ 
  processingStatus, 
  projectName, 
  activeJob 
}: FuturisticAIProcessingScreenProps) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(processingStatus.progress || 0);
  const [aiThoughts, setAiThoughts] = useState('Inicializando sistema de IA...');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  const MAX_TIME = 15 * 60; // 15 minutos en segundos
  
  // Calcular tiempo basado en el trabajo activo si existe
  const startTime = activeJob ? new Date(activeJob.started_at).getTime() : Date.now();

  useEffect(() => {
    // Timer real basado en el tiempo de inicio del trabajo
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    // Progreso ficticio que avanza gradualmente hasta 90%
    if (fakeProgress < 90) {
      const progressTimer = setInterval(() => {
        setFakeProgress(prev => {
          const newProgress = Math.min(prev + 0.5, 90);
          return newProgress;
        });
      }, 2000); // Incrementa cada 2 segundos

      return () => clearInterval(progressTimer);
    }
  }, [fakeProgress]);

  useEffect(() => {
    // Generar partículas flotantes
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    // Pensamientos de IA que cambian dinámicamente
    const thoughts = [
      'Analizando estructura de documentos...',
      'Extrayendo información clave...',
      'Procesando datos con algoritmos avanzados...',
      'Identificando patrones y tendencias...',
      'Generando insights inteligentes...',
      'Optimizando resultados finales...',
      'Aplicando modelos de machine learning...',
      'Sintetizando información compleja...',
      'Creando reporte ejecutivo...',
      'Validando coherencia de datos...',
      'Refinando análisis predictivo...',
      'Integrando múltiples fuentes de datos...'
    ];

    const thoughtTimer = setInterval(() => {
      const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
      setAiThoughts(randomThought);
    }, 3000);

    return () => clearInterval(thoughtTimer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timeRemaining = Math.max(0, MAX_TIME - timeElapsed);
  const timeProgress = (timeElapsed / MAX_TIME) * 100;

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
          <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-r from-sierra-teal/30 to-cyan-400/30 flex items-center justify-center relative overflow-hidden border border-sierra-teal/50">
            {/* Ondas de energía */}
            <div className="absolute inset-0 rounded-full border-2 border-sierra-teal/20 animate-ping"></div>
            <div className="absolute inset-4 rounded-full border-2 border-sierra-teal/30 animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute inset-8 rounded-full border-2 border-sierra-teal/40 animate-ping" style={{ animationDelay: '1s' }}></div>
            
            {/* Icono central rotando */}
            <div className="relative z-10 animate-spin" style={{ animationDuration: '8s' }}>
              <Brain className="h-16 w-16 text-sierra-teal" />
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
            <span className="text-sierra-teal font-mono text-lg">{projectName}</span>
          </div>
        </div>

        {/* Pensamientos de IA */}
        <div className="mb-8 text-center">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-sierra-teal/30 rounded-xl p-6 max-w-lg">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-5 w-5 text-sierra-teal animate-pulse" />
              <span className="text-sierra-teal font-mono text-sm">AI THOUGHTS</span>
            </div>
            <p className="text-cyan-300 font-mono text-lg">{aiThoughts}</p>
          </div>
        </div>

        {/* Barra de progreso principal */}
        <div className="w-full max-w-2xl mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-sierra-teal/30 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sierra-teal font-mono text-lg">PROGRESO</span>
              <span className="text-white font-mono text-2xl">{Math.round(fakeProgress)}%</span>
            </div>
            
            <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden border border-sierra-teal/30">
              <div 
                className="h-full bg-gradient-to-r from-sierra-teal via-cyan-400 to-emerald-400 transition-all duration-1000 relative"
                style={{ width: `${fakeProgress}%` }}
              >
                {/* Efecto de brillo */}
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                {/* Líneas de energía */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" 
                     style={{ animationDuration: '2s' }}></div>
              </div>
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
            <div className="text-white font-mono text-2xl">{formatTime(timeElapsed)}</div>
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
        <div className="w-full max-w-xl">
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

        {/* Mensaje de persistencia */}
        <div className="mt-8 text-center">
          <p className="text-cyan-300/70 font-mono text-sm max-w-md">
            Este proceso continuará ejecutándose incluso si cierras esta ventana. 
            Puedes regresar en cualquier momento para ver el progreso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FuturisticAIProcessingScreen;
