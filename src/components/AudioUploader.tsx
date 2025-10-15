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
    <div className="max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300",
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-border bg-card hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className={cn(
            "w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300",
            isDragging 
              ? "bg-primary scale-110" 
              : "bg-primary/10"
          )}>
            <Mic className={cn(
              "h-14 w-14 transition-colors duration-300",
              isDragging ? "text-primary-foreground" : "text-primary"
            )} />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-6">
          {selectedFile ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-3 text-foreground">
                <Music className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg">{selectedFile.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <Button
                onClick={handleUploadClick}
                disabled={disabled}
                size="lg"
                className="px-8 py-6 text-lg font-semibold"
              >
                <Upload className="h-5 w-5 mr-2" />
                Transcribir Audio
              </Button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-foreground">
                Arrastra tu archivo de audio aquí
              </h3>
              <p className="text-muted-foreground">
                o haz clic para seleccionar
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                variant="outline"
                size="lg"
                className="mt-4 px-6"
              >
                <Upload className="h-5 w-5 mr-2" />
                Seleccionar Archivo
              </Button>
            </>
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
      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Formatos aceptados: MP3, WAV, M4A, OGG, FLAC
        </p>
        <p className="text-xs text-muted-foreground">
          Tamaño máximo: 100MB
        </p>
      </div>
    </div>
  );
};
