
import React from 'react';
import MultiStepUploader from '@/components/MultiStepUploader';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-sierra-teal mb-4">
            Generador de Informes Multi-Área
          </h1>
          <p className="text-xl text-sierra-gray max-w-3xl mx-auto">
            Sube archivos de diferentes áreas empresariales y genera un informe integral con inteligencia artificial
          </p>
        </div>

        {/* Main Uploader */}
        <MultiStepUploader />
      </div>
    </div>
  );
};

export default Index;
