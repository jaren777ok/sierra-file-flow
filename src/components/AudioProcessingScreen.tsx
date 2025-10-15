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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary))_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bg-primary/20 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: '6px',
              height: '6px',
              animationDelay: `${particle.delay}s`,
              animationDuration: '3s',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Audio visualization */}
        <div className="relative mb-16">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 rounded-full border-2 border-primary/10 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute w-64 h-64 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
          </div>

          <div className="relative w-48 h-48 mx-auto rounded-full bg-primary flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/50 animate-pulse" style={{ animationDuration: '2s' }} />
            <Mic className="h-20 w-20 text-primary-foreground relative z-10" />
          </div>

          {/* Audio waves */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 40 + 20}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Status text */}
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-4xl font-bold text-foreground animate-fade-in">
            {processingStatus.status === 'uploading' ? 'Enviando Audio' : 'Transcribiendo Audio'}
          </h1>

          <div className="bg-card border border-border rounded-xl p-8 space-y-6 shadow-lg">
            <div className="flex items-center justify-center gap-3 text-primary">
              <Activity className="h-5 w-5 animate-pulse" />
              <p className="text-lg font-medium">{currentMessage}</p>
            </div>

            <Progress value={processingStatus.progress} className="h-3" />

            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="font-semibold">{processingStatus.progress.toFixed(0)}%</span>
              <span>{formatTime(processingStatus.timeElapsed)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Waves className="h-4 w-4 animate-pulse" />
            <span>Procesando con IA avanzada...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
