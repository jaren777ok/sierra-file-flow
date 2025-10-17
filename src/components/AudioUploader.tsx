import React, { useState, useRef } from 'react';
import { Mic, Upload, FileAudio, X, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AudioProcessingService } from '@/services/audioProcessingService';
import { AUDIO_CONFIG } from '@/constants/audio';

interface AudioUploaderProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export const AudioUploader = ({ onUpload, disabled }: AudioUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const validation = AudioProcessingService.validateAudioFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-12 md:p-16 text-center transition-all duration-300 bg-white dark:bg-card shadow-xl",
          isDragging 
            ? "border-primary bg-blue-50 dark:bg-primary/10 scale-[1.02] shadow-2xl" 
            : selectedFile
            ? "border-primary bg-blue-50/50 dark:bg-primary/5"
            : "border-border hover:border-primary/50 hover:shadow-2xl",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className={cn(
            "relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-300",
            isDragging 
              ? "audio-gradient scale-110 shadow-2xl" 
              : selectedFile
              ? "audio-gradient shadow-xl"
              : "bg-gradient-to-br from-blue-100 to-purple-100 dark:from-primary/20 dark:to-accent/20"
          )}>
            {isDragging && (
              <div className="absolute inset-0 rounded-full audio-gradient animate-ping opacity-50" />
            )}
            <Mic className={cn(
              "h-14 w-14 md:h-16 md:h-16 transition-all duration-300 relative z-10",
              isDragging || selectedFile ? "text-white" : "text-primary"
            )} />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-6">
          {selectedFile ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-center gap-3 text-foreground flex-wrap px-4">
                <FileAudio className="h-6 w-6 text-primary flex-shrink-0" />
                <span className="font-semibold text-lg break-all">{selectedFile.name}</span>
              </div>
              <p className="text-base text-primary font-medium">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <Button
                onClick={handleUploadClick}
                disabled={disabled}
                size="lg"
                className="audio-gradient text-white px-10 py-7 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0"
              >
                <Upload className="h-6 w-6 mr-2" />
                Transcribir Audio
              </Button>
              <Button
                onClick={() => setSelectedFile(null)}
                disabled={disabled}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Cambiar archivo
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                Arrastra tu archivo de audio aquí
              </h3>
              <p className="text-base text-muted-foreground">
                o haz clic en el botón para seleccionar
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                size="lg"
                className="mt-4 px-8 py-6 text-base audio-gradient text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-0"
              >
                <Upload className="h-5 w-5 mr-2" />
                Seleccionar Archivo
              </Button>
            </div>
          )}
        </div>

        {/* File input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={AUDIO_CONFIG.ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Info */}
      <div className="mt-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-primary/10 px-4 py-2 rounded-full border border-blue-200 dark:border-primary/20">
          <FileAudio className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-primary">
            Formatos: MP3, WAV, M4A, OGG, FLAC
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Tamaño máximo: 100MB
        </p>
      </div>
    </div>
  );
};
