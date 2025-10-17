import React from 'react';
import { Mic, Sparkles, Activity, Waves } from 'lucide-react';
import Header from '@/components/Header';
import { AudioUploader } from '@/components/AudioUploader';
import { AudioProcessingScreen } from '@/components/AudioProcessingScreen';
import { AudioResultScreen } from '@/components/AudioResultScreen';
import { useAudioProcessing } from '@/hooks/useAudioProcessing';

const ConvertAudio = () => {
  const { 
    processingStatus, 
    downloadUrl, 
    originalFileName,
    startProcessing, 
    resetProcessing 
  } = useAudioProcessing();

  const handleUpload = async (file: File) => {
    await startProcessing(file);
  };

  // Show processing screen
  if (processingStatus.status === 'uploading' || processingStatus.status === 'processing' || processingStatus.status === 'error') {
    return <AudioProcessingScreen processingStatus={processingStatus} />;
  }

  // Show result screen
  if (processingStatus.status === 'completed' && downloadUrl) {
    return (
      <AudioResultScreen
        downloadUrl={downloadUrl}
        originalFileName={originalFileName}
        processingTime={processingStatus.timeElapsed}
        onStartNew={resetProcessing}
      />
    );
  }

  // Show upload screen (idle state)
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero section with gradient */}
        <div className="relative mb-16 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 audio-gradient opacity-10" />
          <div className="relative text-center py-16 md:py-20 space-y-6">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 audio-gradient rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full audio-gradient flex items-center justify-center shadow-2xl animate-float">
                  <Mic className="h-12 w-12 md:h-16 md:w-16 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                Convertir Audio a <span className="audio-gradient bg-clip-text text-transparent">Texto</span>
              </h1>
              
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <p className="text-lg md:text-xl text-muted-foreground">
                  Transcripción automática con IA avanzada
                </p>
              </div>
            </div>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Sube tu entrevista, reunión o podcast y recibe la transcripción completa en formato Word
            </p>
          </div>
        </div>

        {/* Uploader */}
        <AudioUploader
          onUpload={handleUpload}
          disabled={processingStatus.status !== 'idle'}
        />

        {/* Info section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="text-5xl font-bold audio-gradient bg-clip-text text-transparent mb-3">100MB</div>
              <p className="text-sm font-medium text-muted-foreground">Tamaño máximo de archivo</p>
            </div>
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="text-5xl font-bold audio-gradient bg-clip-text text-transparent mb-3">5+</div>
              <p className="text-sm font-medium text-muted-foreground">Formatos de audio aceptados</p>
            </div>
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="text-5xl font-bold audio-gradient bg-clip-text text-transparent mb-3">100%</div>
              <p className="text-sm font-medium text-muted-foreground">Precisión con IA avanzada</p>
            </div>
          </div>
        </div>

        {/* Use cases */}
        <div className="mt-20 max-w-5xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Casos de <span className="audio-gradient bg-clip-text text-transparent">Uso</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-primary/50">
              <div className="w-16 h-16 rounded-xl audio-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Mic className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Entrevistas</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Transcribe entrevistas profesionales completas con precisión y rapidez
              </p>
            </div>
            <div className="group bg-white dark:bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-primary/50">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Reuniones</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Convierte grabaciones de reuniones en documentos editables y compartibles
              </p>
            </div>
            <div className="group bg-white dark:bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-accent/50">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Waves className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Podcasts</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Genera transcripciones completas de episodios para mejorar tu SEO
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConvertAudio;
