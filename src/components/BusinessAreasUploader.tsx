
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BusinessArea from './BusinessArea';
import { Badge } from '@/components/ui/badge';

const BusinessAreasUploader = () => {
  const [activeArea, setActiveArea] = useState<string | null>(null);
  
  const areas = [
    {
      id: 'comercial',
      name: 'ÁREA COMERCIAL',
      description: 'Sube los documentos relacionados con el área comercial para su procesamiento.'
    },
    {
      id: 'operaciones',
      name: 'ÁREA DE OPERACIONES',
      description: 'Sube los documentos relacionados con operaciones para su análisis.'
    },
    {
      id: 'pricing',
      name: 'ÁREA DE PRICING',
      description: 'Sube los documentos de pricing para su revisión y optimización.'
    },
    {
      id: 'administracion',
      name: 'ÁREA DE ADMINISTRACIÓN',
      description: 'Sube los documentos administrativos para su procesamiento.'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Indicador de áreas */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {areas.map((area) => (
          <Badge
            key={area.id}
            variant={activeArea === area.id ? "default" : "outline"}
            className={`px-4 py-2 text-sm cursor-pointer transition-all ${
              activeArea === area.id 
                ? 'bg-sierra-teal text-white' 
                : 'hover:bg-sierra-teal/10 border-sierra-teal text-sierra-teal'
            }`}
            onClick={() => setActiveArea(activeArea === area.id ? null : area.id)}
          >
            {area.name}
          </Badge>
        ))}
      </div>

      {/* Áreas de carga */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {areas.map((area) => (
          <div key={area.id} className="space-y-4">
            <div 
              className={`transition-all duration-300 ${
                activeArea === null || activeArea === area.id 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-50 scale-95'
              }`}
            >
              <BusinessArea
                areaName={area.id}
                areaTitle={area.name}
                description={area.description}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessAreasUploader;
