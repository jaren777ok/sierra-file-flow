
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const Stats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="mountain-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-sierra-brown">
            Archivos Procesados
          </CardTitle>
          <FileText className="h-4 w-4 text-sierra-brown" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sierra-brown">0</div>
          <p className="text-xs text-sierra-gray">
            En esta sesión
          </p>
        </CardContent>
      </Card>

      <Card className="mountain-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-sierra-brown">
            Tiempo Máximo
          </CardTitle>
          <Clock className="h-4 w-4 text-sierra-brown" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sierra-brown">15</div>
          <p className="text-xs text-sierra-gray">
            Minutos por archivo
          </p>
        </CardContent>
      </Card>

      <Card className="mountain-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">
            Exitosos
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">0</div>
          <p className="text-xs text-sierra-gray">
            Completados
          </p>
        </CardContent>
      </Card>

      <Card className="mountain-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-700">
            Errores
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-700">0</div>
          <p className="text-xs text-sierra-gray">
            Con problemas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stats;
