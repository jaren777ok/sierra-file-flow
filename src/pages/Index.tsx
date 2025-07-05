
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import BusinessAreasUploader from '@/components/BusinessAreasUploader';
import Stats from '@/components/Stats';
import { 
  Sparkles, 
  Zap, 
  Shield, 
  Clock,
  ArrowRight,
  CheckCircle 
} from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sierra-teal/10 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sierra-teal mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-sierra-teal">Cargando...</h3>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const features = [
    {
      icon: Sparkles,
      title: "IA Avanzada",
      description: "Procesamiento inteligente con tecnología de última generación"
    },
    {
      icon: Zap,
      title: "Rápido y Eficiente",
      description: "Resultados en minutos, no en horas"
    },
    {
      icon: Shield,
      title: "Seguro y Confiable",
      description: "Tus archivos están protegidos con encriptación avanzada"
    },
    {
      icon: Clock,
      title: "Disponible 24/7",
      description: "Procesa tus archivos cuando lo necesites"
    }
  ];

  const steps = [
    "Selecciona el área de trabajo",
    "Ingresa el nombre del proyecto",
    "Sube exactamente 2 archivos",
    "¡Recibe tus archivos procesados!"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-sierra-teal/5">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-sierra-teal/10 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-5 w-5 text-sierra-teal" />
              <span className="text-sierra-teal font-medium">¡Bienvenido, {user.email?.split('@')[0]}!</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-sierra-teal mb-4">
              Procesamiento Inteligente
              <span className="block text-3xl md:text-4xl bg-gradient-to-r from-sierra-teal to-sierra-teal/70 bg-clip-text text-transparent">
                de Archivos con IA
              </span>
            </h1>
            
            <p className="text-xl text-sierra-gray max-w-3xl mx-auto leading-relaxed">
              Transforma tus documentos con nuestra tecnología de inteligencia artificial. 
              Selecciona el área, sube tus archivos y recibe resultados optimizados en minutos.
            </p>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-sierra-teal/10 hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="w-12 h-12 bg-sierra-teal/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-sierra-teal" />
                  </div>
                  <h3 className="font-semibold text-sierra-teal mb-2">{feature.title}</h3>
                  <p className="text-sierra-gray text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* How it Works */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 mb-12 shadow-lg border border-sierra-teal/10">
            <h2 className="text-2xl font-bold text-sierra-teal text-center mb-8">
              ¿Cómo Funciona?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-10 h-10 bg-sierra-teal text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                    {index + 1}
                  </div>
                  <p className="text-sierra-gray font-medium">{step}</p>
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-sierra-teal/50 mx-auto mt-4 hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8">
            <Stats />
          </div>
          
          {/* Main Processing Section */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-sierra-teal mb-4">
                Procesamiento por Áreas Especializadas
              </h2>
              <p className="text-sierra-gray max-w-4xl mx-auto text-lg">
                Cada área tiene su propio algoritmo de IA especializado para obtener los mejores resultados. 
                Selecciona el área correspondiente y comienza el procesamiento inteligente.
              </p>
            </div>
            
            <BusinessAreasUploader />
          </div>
          
          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-sierra-teal to-sierra-teal/80 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">¿Necesitas ayuda?</h3>
              <p className="text-sierra-teal/10 mb-6 text-lg">
                Nuestro sistema está diseñado para ser intuitivo, pero si tienes dudas, 
                recuerda que cada área requiere exactamente 2 archivos y un nombre de proyecto.
              </p>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Sistema funcionando correctamente</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="sierra-gradient text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img 
              src="https://jbunbmphadxmzjokwgkw.supabase.co/storage/v1/object/sign/fotos/logo%20sierras%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGY4MzVlOS03N2Y3LTRiMWQtOWE0MS03NTVhYzYxNTM3NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmb3Rvcy9sb2dvIHNpZXJyYXMgKDEpLnBuZyIsImlhdCI6MTc1MTY4NDM4NSwiZXhwIjoxNzgzMjIwMzg1fQ.XwugQX71wgOioRTdXdEB7LEFguocbub7FRI62qvzmFs"
              alt="Grupo Sierras Logo"
              className="h-8 w-auto"
            />
            <span className="font-bold">GRUPO SIERRAS</span>
          </div>
          <p className="text-sm opacity-90 mb-2">
            © 2024 Grupo Sierras. Todos los derechos reservados.
          </p>
          <p className="text-xs opacity-75">
            Procesamiento inteligente de documentos con IA - gruposierras.mx
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
