
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BusinessArea from './BusinessArea';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Settings, 
  DollarSign, 
  FileSpreadsheet,
  Sparkles 
} from 'lucide-react';

const BusinessAreasUploader = () => {
  const [activeArea, setActiveArea] = useState<string | null>(null);
  
  const areas = [
    {
      id: 'comercial',
      name: 'ÁREA COMERCIAL',
      description: 'Optimiza estrategias comerciales, análisis de ventas y propuestas de negocio con IA especializada.',
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'operaciones',
      name: 'ÁREA DE OPERACIONES',
      description: 'Mejora procesos operativos, workflow y eficiencia organizacional con análisis inteligente.',
      icon: Settings,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'pricing',
      name: 'ÁREA DE PRICING',
      description: 'Analiza estrategias de precios, competitividad y optimización de márgenes con IA avanzada.',
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'administracion',
      name: 'ÁREA DE ADMINISTRACIÓN',
      description: 'Procesa documentos administrativos, reportes y análisis de gestión con precisión.',
      icon: FileSpreadsheet,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header con indicadores */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-sierra-teal" />
          <h3 className="text-2xl font-bold text-sierra-teal">
            Selecciona tu Área de Trabajo
          </h3>
        </div>
        <p className="text-sierra-gray max-w-2xl mx-auto">
          Cada área está optimizada con algoritmos de IA específicos para maximizar la calidad del procesamiento.
        </p>
      </div>

      {/* Indicador de áreas */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {areas.map((area) => {
          const Icon = area.icon;
          return (
            <Badge
              key={area.id}
              variant={activeArea === area.id ? "default" : "outline"}
              className={`px-4 py-3 text-sm cursor-pointer transition-all duration-200 hover:scale-105 ${
                activeArea === area.id 
                  ? 'bg-sierra-teal text-white shadow-lg' 
                  : 'hover:bg-sierra-teal/10 border-sierra-teal text-sierra-teal hover:shadow-md'
              }`}
              onClick={() => setActiveArea(activeArea === area.id ? null : area.id)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {area.name}
            </Badge>
          );
        })}
      </div>

      {/* Áreas de carga con diseño mejorado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {areas.map((area) => {
          const Icon = area.icon;
          return (
            <div key={area.id} className="space-y-4">
              <div 
                className={`transition-all duration-500 ${
                  activeArea === null || activeArea === area.id 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-60 scale-95 translate-y-2'
                }`}
              >
                {/* Header del área */}
                <Card className={`${area.bgColor} border-0 shadow-sm mb-4`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${area.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sierra-teal text-lg mb-1">
                          {area.name}
                        </h4>
                        <p className="text-sierra-gray text-sm leading-relaxed">
                          {area.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Componente de carga */}
                <BusinessArea
                  areaName={area.id}
                  areaTitle={area.name}
                  description={area.description}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Información adicional */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-6 bg-gradient-to-br from-sierra-teal/5 to-sierra-teal/10 border-sierra-teal/20">
          <div className="w-12 h-12 bg-sierra-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6 text-sierra-teal" />
          </div>
          <h3 className="font-semibold text-sierra-teal mb-2">IA Especializada</h3>
          <p className="text-sierra-gray text-sm">
            Cada área utiliza modelos de IA entrenados específicamente para ese tipo de documentos.
          </p>
        </Card>

        <Card className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-green-700 mb-2">Proceso Automatizado</h3>
          <p className="text-green-600 text-sm">
            Sube 2 archivos y deja que la IA haga el trabajo pesado por ti.
          </p>
        </Card>

        <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-blue-700 mb-2">Resultados Precisos</h3>
          <p className="text-blue-600 text-sm">
            Obtén archivos procesados con la más alta calidad y precisión.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default BusinessAreasUploader;
