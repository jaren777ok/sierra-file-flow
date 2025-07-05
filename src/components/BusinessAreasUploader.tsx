
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BusinessArea from './BusinessArea';

const BusinessAreasUploader = () => {
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
    <div className="w-full">
      <Tabs defaultValue="comercial" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          {areas.map((area) => (
            <TabsTrigger 
              key={area.id} 
              value={area.id}
              className="text-xs sm:text-sm font-medium"
            >
              {area.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {areas.map((area) => (
          <TabsContent key={area.id} value={area.id} className="mt-0">
            <BusinessArea
              areaName={area.id}
              areaTitle={area.name}
              description={area.description}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default BusinessAreasUploader;
