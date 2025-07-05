
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { Download, Search, FileText, Calendar, Building2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SavedFiles = () => {
  const { files, loading, fetchSavedFiles, downloadFile } = useSavedFiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');

  const areas = [
    { id: 'all', name: 'Todas las Áreas', color: 'bg-gray-500' },
    { id: 'comercial', name: 'Comercial', color: 'bg-blue-500' },
    { id: 'operaciones', name: 'Operaciones', color: 'bg-green-500' },
    { id: 'pricing', name: 'Pricing', color: 'bg-purple-500' },
    { id: 'administracion', name: 'Administración', color: 'bg-orange-500' }
  ];

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'all' || file.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  const getAreaColor = (area: string) => {
    const areaConfig = areas.find(a => a.id === area);
    return areaConfig?.color || 'bg-gray-500';
  };

  const getAreaName = (area: string) => {
    const areaConfig = areas.find(a => a.id === area);
    return areaConfig?.name || area.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-sierra-teal animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-sierra-teal">Cargando archivos...</h3>
              <p className="text-sierra-gray mt-2">Obteniendo tus archivos guardados</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-sierra-teal" />
            <h1 className="text-3xl font-bold text-sierra-teal">Archivos Guardados</h1>
          </div>
          <p className="text-sierra-gray text-lg">
            Gestiona y descarga todos tus archivos procesados
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-sierra-gray" />
                <Input
                  placeholder="Buscar por proyecto o área..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-sierra-teal/20 focus:border-sierra-teal"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => (
                  <Badge
                    key={area.id}
                    variant={selectedArea === area.id ? "default" : "outline"}
                    className={`cursor-pointer px-4 py-2 transition-all ${
                      selectedArea === area.id 
                        ? 'bg-sierra-teal text-white' 
                        : 'hover:bg-sierra-teal/10 border-sierra-teal text-sierra-teal'
                    }`}
                    onClick={() => setSelectedArea(area.id)}
                  >
                    {area.name}
                  </Badge>
                ))}
              </div>

              <Button
                onClick={fetchSavedFiles}
                variant="outline"
                size="sm"
                className="border-sierra-teal text-sierra-teal hover:bg-sierra-teal hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Files Grid */}
        {filteredFiles.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-sierra-gray/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-sierra-gray mb-2">
                {files.length === 0 ? 'No hay archivos guardados' : 'No se encontraron archivos'}
              </h3>
              <p className="text-sierra-gray">
                {files.length === 0 
                  ? 'Procesa algunos archivos para verlos aquí' 
                  : 'Intenta con diferentes términos de búsqueda'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-200 hover:scale-105">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-sierra-teal line-clamp-2">
                      {file.project_title}
                    </CardTitle>
                    <Badge className={`${getAreaColor(file.area)} text-white shrink-0 ml-2`}>
                      {getAreaName(file.area)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-sierra-gray">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(file.created_at), 'PPP', { locale: es })}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-sierra-gray">
                    <Building2 className="h-4 w-4" />
                    {getAreaName(file.area)}
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => downloadFile(file.drive_url, `${file.project_title}_${file.area}`)}
                      className="w-full sierra-gradient hover:opacity-90 transition-opacity"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Archivo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {files.length > 0 && (
          <Card className="mt-8 shadow-lg border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <h3 className="text-2xl font-bold text-sierra-teal">{files.length}</h3>
                  <p className="text-sierra-gray">Total de Archivos</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-sierra-teal">
                    {new Set(files.map(f => f.area)).size}
                  </h3>
                  <p className="text-sierra-gray">Áreas Procesadas</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-sierra-teal">
                    {new Set(files.map(f => f.project_title)).size}
                  </h3>
                  <p className="text-sierra-gray">Proyectos Únicos</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-sierra-teal">
                    {filteredFiles.length}
                  </h3>
                  <p className="text-sierra-gray">Resultados Filtrados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SavedFiles;
