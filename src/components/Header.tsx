
import React from 'react';

const Header = () => {
  return (
    <header className="sierra-gradient text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img 
              src="https://jbunbmphadxmzjokwgkw.supabase.co/storage/v1/object/sign/fotos/logo%20sierras.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGY4MzVlOS03N2Y3LTRiMWQtOWE0MS03NTVhYzYxNTM3NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmb3Rvcy9sb2dvIHNpZXJyYXMucG5nIiwiaWF0IjoxNzUxNjgzMTI5LCJleHAiOjE3ODMyMTkxMjl9.ANVHU98wECY7CZwXrQTxX6z_zH2scb5cEDLmHBBmVls"
              alt="Grupo Sierras Logo"
              className="h-12 w-auto"
            />
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
