
import React from 'react';
import Header from '@/components/Header';
import BusinessAreasUploader from '@/components/BusinessAreasUploader';
import Stats from '@/components/Stats';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Stats />
          
          <div className="mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-sierra-brown mb-2">
                Procesamiento Inteligente por Áreas
              </h3>
              <p className="text-sierra-gray max-w-3xl mx-auto">
                Selecciona el área correspondiente y sube exactamente 2 archivos para cada una. 
                Nuestra IA procesará los documentos y te proporcionará los resultados optimizados.
              </p>
            </div>
          </div>
          
          <BusinessAreasUploader />
          
          <div className="mt-12 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-sierra-brown/10 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-sierra-brown font-medium">
                Sistema conectado y funcionando
              </span>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-sierra-brown text-white py-6 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-90">
            © 2024 Grupo Sierras. Todos los derechos reservados.
          </p>
          <p className="text-xs opacity-75 mt-1">
            gruposierras.mx - Procesamiento inteligente de documentos
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
