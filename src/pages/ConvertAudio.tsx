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
        <div className="text-center mb-12 space-y-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Mic className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Convertir Audio a Texto
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sube una entrevista en audio y recibe la transcripción completa en formato Word
          </p>
        </div>

        {/* Uploader */}
        <AudioUploader
          onUpload={handleUpload}
          disabled={processingStatus.status !== 'idle'}
        />

        {/* Info section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">100MB</div>
              <p className="text-sm text-muted-foreground">Tamaño máximo</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">5+</div>
              <p className="text-sm text-muted-foreground">Formatos aceptados</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <p className="text-sm text-muted-foreground">Precisión con IA</p>
            </div>
          </div>
        </div>

        {/* Use cases */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Casos de Uso
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">Entrevistas</h3>
              <p className="text-sm text-muted-foreground">Transcribe entrevistas completas automáticamente</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">Reuniones</h3>
              <p className="text-sm text-muted-foreground">Convierte reuniones de audio en documentos</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">Podcasts</h3>
              <p className="text-sm text-muted-foreground">Genera transcripciones de episodios completos</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConvertAudio;
