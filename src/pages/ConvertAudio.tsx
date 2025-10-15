import React from 'react';
import { Mic, Sparkles } from 'lucide-react';
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
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero section */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center animate-pulse">
              <Mic className="h-8 w-8 text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Convertir Audio a Texto
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sube una entrevista en audio y recibe la transcripción completa en formato Word
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mt-6">
            <div className="flex items-center gap-2 bg-accent/50 px-4 py-2 rounded-full">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Transcripción con IA</span>
            </div>
            <div className="flex items-center gap-2 bg-accent/50 px-4 py-2 rounded-full">
              <Mic className="h-4 w-4 text-primary" />
              <span>Ideal para entrevistas</span>
            </div>
          </div>
        </div>

        {/* Uploader */}
        <AudioUploader
          onUpload={handleUpload}
          disabled={processingStatus.status !== 'idle'}
        />

        {/* Info section */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">100MB</div>
              <p className="text-sm text-muted-foreground">Tamaño máximo</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">5+</div>
              <p className="text-sm text-muted-foreground">Formatos aceptados</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <p className="text-sm text-muted-foreground">Precisión con IA</p>
            </div>
          </div>
        </div>

        {/* Use cases */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Casos de Uso
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Entrevistas', desc: 'Transcribe entrevistas completas automáticamente' },
              { title: 'Reuniones', desc: 'Convierte reuniones de audio en documentos' },
              { title: 'Podcasts', desc: 'Genera transcripciones de episodios completos' },
            ].map((useCase, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConvertAudio;
