
import React from 'react';
import { Mountain } from 'lucide-react';

const Header = () => {
  return (
    <header className="sierra-gradient text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Mountain className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">GRUPO SIERRAS</h1>
              <p className="text-sm opacity-90">gruposierras.mx</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Procesador de Archivos IA</h2>
          <p className="text-sm opacity-90">
            Sube tus archivos y recíbelos procesados por inteligencia artificial
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
