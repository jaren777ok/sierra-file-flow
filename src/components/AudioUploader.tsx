import React, { useState, useRef } from 'react';
import { Mic, Upload, File, X } from 'lucide-react';
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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-12 
            transition-all duration-300 cursor-pointer
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-105' 
              : 'border-border hover:border-primary/50 hover:bg-accent/5'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={AUDIO_CONFIG.ACCEPTED_EXTENSIONS.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center animate-pulse">
              <Mic className="h-10 w-10 text-white" />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Arrastra tu archivo de audio aquí
              </h3>
              <p className="text-sm text-muted-foreground">
                o haz clic para seleccionar
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              {AUDIO_CONFIG.ACCEPTED_EXTENSIONS.map(ext => (
                <span key={ext} className="px-2 py-1 bg-muted rounded">
                  {ext.toUpperCase()}
                </span>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Tamaño máximo: 100MB
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-border rounded-xl p-6 bg-card">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <File className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {selectedFile.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {AudioProcessingService.formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                className="flex-shrink-0"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleUpload}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-6 text-lg font-semibold"
            disabled={disabled}
          >
            <Upload className="h-5 w-5 mr-2" />
            Transcribir Audio
          </Button>
        </div>
      )}
    </div>
  );
};
