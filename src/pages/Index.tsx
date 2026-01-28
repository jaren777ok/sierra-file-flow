import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import MultiStepUploader from '@/components/MultiStepUploader';
import { Sparkles, Zap, Shield, Clock, ArrowRight, CheckCircle, Brain } from 'lucide-react';
const Index = () => {
  const {
    user,
    loading
  } = useAuth();
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-sierra-teal/10 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sierra-teal mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-sierra-teal">Cargando...</h3>
        </div>
      </div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  const features = [{
    icon: Brain,
    title: "IA Avanzada",
    description: "Procesamiento inteligente multi-área con tecnología de última generación"
  }, {
    icon: Zap,
    title: "Flujo Optimizado",
    description: "Proceso guiado paso a paso para máxima eficiencia"
  }, {
    icon: Shield,
    title: "Seguro y Confiable",
    description: "Tus archivos están protegidos con encriptación avanzada"
  }, {
    icon: Clock,
    title: "Procesamiento Rápido",
    description: "Informes IA listos en máximo 15 minutos"
  }];
  const areas = [{
    name: 'Comercial',
    icon: '💼',
    description: 'Análisis de ventas y estrategias comerciales'
  }, {
    name: 'Operaciones',
    icon: '⚙️',
    description: 'Optimización de procesos operativos'
  }, {
    name: 'Pricing',
    icon: '💰',
    description: 'Estrategias de precios y rentabilidad'
  }, {
    name: 'Administración',
    icon: '🗂️',
    description: 'Gestión administrativa y reportes'
  }];
  return <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-sierra-teal/5">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-sierra-teal/10 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-5 w-5 text-sierra-teal animate-pulse" />
              <span className="text-sierra-teal font-medium">¡Bienvenido, {user.email?.split('@')[0]}!</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-sierra-teal mb-4">
              Generador de Informes
              <span className="block text-3xl md:text-4xl bg-gradient-to-r from-sierra-teal to-sierra-teal/70 bg-clip-text text-transparent">
                Multi-Área con IA
              </span>
            </h1>
            
            <p className="text-xl text-sierra-gray max-w-3xl mx-auto leading-relaxed mb-8">
              Sube archivos de todas las áreas de tu empresa y genera un informe integral 
              procesado con inteligencia artificial en un flujo guiado paso a paso.
            </p>

            {/* Areas Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
              {areas.map((area, index) => <div key={index} className="text-center p-3 bg-white/60 rounded-xl border border-sierra-teal/10">
                  <div className="text-2xl mb-1">{area.icon}</div>
                  <div className="text-sm font-medium text-sierra-teal">{area.name}</div>
                </div>)}
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => {
            const Icon = feature.icon;
            return <div key={index} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-sierra-teal/10 hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 bg-sierra-teal/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-sierra-teal" />
                  </div>
                  <h3 className="font-semibold text-sierra-teal mb-2">{feature.title}</h3>
                  <p className="text-sierra-gray text-sm">{feature.description}</p>
                </div>;
          })}
          </div>

          {/* How it Works */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 mb-12 shadow-lg border border-sierra-teal/10">
            <h2 className="text-2xl font-bold text-sierra-teal text-center mb-8">
              ¿Cómo Funciona el Proceso?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {[{
              step: '1',
              title: 'Proyecto',
              desc: 'Nombre del proyecto'
            }, {
              step: '2',
              title: 'Comercial',
              desc: 'Sube archivos comerciales'
            }, {
              step: '3',
              title: 'Operaciones',
              desc: 'Sube archivos operativos'
            }, {
              step: '4',
              title: 'Pricing',
              desc: 'Sube archivos de precios'
            }, {
              step: '5',
              title: 'Admin',
              desc: 'Sube archivos administrativos'
            }, {
              step: '6',
              title: 'IA Report',
              desc: '¡Informe generado!'
            }].map((item, index) => <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-sierra-teal text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-sierra-teal text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-sierra-gray">{item.desc}</p>
                  {index < 5 && <ArrowRight className="h-4 w-4 text-sierra-teal/50 mx-auto mt-2 hidden md:block" />}
                </div>)}
            </div>
          </div>
          
          {/* Main Processing Section */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-sierra-teal mb-4">
                Generador de Informes Multi-Área
              </h2>
              <p className="text-sierra-gray max-w-4xl mx-auto text-lg">
                Sigue el proceso guiado para subir archivos de cada área y generar 
                un informe integral procesado con IA. Máximo 5 archivos por área.
              </p>
            </div>
            
            <MultiStepUploader />
          </div>
          
          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-sierra-teal to-sierra-teal/80 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">¿Necesitas ayuda?</h3>
              <p className="text-white/90 mb-6 text-lg">El sistema te guiará paso a paso. Cada área puede tener hasta 10 archivos. El procesamiento IA toma máximo 15 minutos.</p>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Sistema IA funcionando correctamente</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="sierra-gradient text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo-sierras.png" alt="Grupo Sierras Logo" className="h-8 w-auto" />
            <span className="font-bold">GRUPO SIERRAS</span>
          </div>
          <p className="text-sm opacity-90 mb-2">
            © 2024 Grupo Sierras. Todos los derechos reservados.
          </p>
          <p className="text-xs opacity-75">
            Procesamiento inteligente multi-área con IA - gruposierras.mx
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;