import React, { useEffect, useState } from 'react';
import { Mic, Waves, Activity, AlertCircle } from 'lucide-react';
import { AudioProcessingStatus } from '@/types/audio';
import { AUDIO_MESSAGES } from '@/constants/audio';
import { Progress } from '@/components/ui/progress';

interface AudioProcessingScreenProps {
  processingStatus: AudioProcessingStatus;
}

export const AudioProcessingScreen = ({ processingStatus }: AudioProcessingScreenProps) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const messages = processingStatus.status === 'uploading' 
      ? AUDIO_MESSAGES.uploading 
      : AUDIO_MESSAGES.processing;

    const messageInterval = setInterval(() => {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(randomMessage);
    }, 3000);

    setCurrentMessage(messages[0]);

    return () => clearInterval(messageInterval);
  }, [processingStatus.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (processingStatus.status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-lg">
          <div className="w-32 h-32 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-16 w-16 text-destructive" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Error en el Procesamiento
            </h2>
            <p className="text-destructive text-lg">
              {processingStatus.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-background dark:via-background dark:to-background relative overflow-hidden">
      {/* Dynamic background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary))_2px,transparent_2px),linear-gradient(90deg,hsl(var(--primary))_2px,transparent_2px)] bg-[size:60px_60px]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${8 + Math.random() * 8}px`,
              height: `${8 + Math.random() * 8}px`,
              background: particle.id % 2 === 0 
                ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' 
                : 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))',
              opacity: 0.15,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${4 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        {/* Audio visualization */}
        <div className="relative mb-12 md:mb-16">
          {/* Animated rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-72 h-72 md:w-96 md:h-96 rounded-full border-2 border-primary/20 animate-pulse-ring" />
            <div className="absolute w-56 h-56 md:w-80 md:h-80 rounded-full border-2 border-primary/30 animate-pulse-ring" style={{ animationDelay: '1s' }} />
            <div className="absolute w-40 h-40 md:w-64 md:h-64 rounded-full border-2 border-accent/40 animate-pulse-ring" style={{ animationDelay: '2s' }} />
          </div>

          {/* Central microphone */}
          <div className="relative w-40 h-40 md:w-56 md:h-56 mx-auto">
            <div className="absolute inset-0 audio-gradient rounded-full blur-2xl opacity-60 animate-pulse" />
            <div className="relative w-full h-full rounded-full audio-gradient flex items-center justify-center shadow-2xl">
              <Mic className="h-16 w-16 md:h-24 md:w-24 text-white relative z-10 animate-pulse" style={{ animationDuration: '2s' }} />
            </div>
          </div>

          {/* Animated audio waves */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 md:w-2 rounded-full audio-gradient shadow-lg"
                style={{
                  height: `${20 + Math.sin(Date.now() / 200 + i) * 30}px`,
                  animation: `wave-pulse ${0.6 + Math.random() * 0.4}s ease-in-out infinite`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Status card */}
        <div className="text-center space-y-6 md:space-y-8 max-w-2xl w-full px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground animate-fade-in">
            {processingStatus.status === 'uploading' ? (
              <>Enviando <span className="audio-gradient bg-clip-text text-transparent">Audio</span></>
            ) : (
              <>Transcribiendo con <span className="audio-gradient bg-clip-text text-transparent">IA</span></>
            )}
          </h1>

          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-2 border-primary/20 rounded-3xl p-6 md:p-10 space-y-6 shadow-2xl">
            <div className="flex items-center justify-center gap-3 text-primary flex-wrap">
              <Activity className="h-6 w-6 animate-pulse flex-shrink-0" />
              <p className="text-base md:text-lg font-semibold">{currentMessage}</p>
            </div>

            <div className="space-y-3">
              <Progress value={processingStatus.progress} className="h-4 md:h-5" />
              
              <div className="flex justify-between items-center text-sm md:text-base">
                <span className="font-bold text-2xl md:text-3xl audio-gradient bg-clip-text text-transparent">
                  {processingStatus.progress.toFixed(0)}%
                </span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Waves className="h-4 w-4 animate-pulse" />
                  <span className="font-mono">{formatTime(processingStatus.timeElapsed)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm md:text-base">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>Procesando con IA avanzada de última generación</span>
          </div>
        </div>
      </div>
    </div>
  );
};
