
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { Download, Search, FileText, Calendar, RefreshCw, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SavedFiles = () => {
  const { files, loading, fetchSavedFiles, updateFileNotes, downloadFile } = useSavedFiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.project_title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleEditNotes = (fileId: string, currentNotes: string) => {
    setEditingNotes(fileId);
    setTempNotes(currentNotes || '');
  };

  const handleSaveNotes = async (fileId: string) => {
    await updateFileNotes(fileId, tempNotes);
    setEditingNotes(null);
    setTempNotes('');
  };

  const handleCancelEdit = () => {
    setEditingNotes(null);
    setTempNotes('');
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
            Gestiona y descarga todos tus informes IA multi-área
          </p>
        </div>

        {/* Search and Refresh */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-sierra-gray" />
                <Input
                  placeholder="Buscar por nombre de proyecto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-sierra-teal/20 focus:border-sierra-teal"
                />
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
              <Card key={file.id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-sierra-teal line-clamp-2">
                    {file.project_title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-sierra-gray">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(file.created_at), 'PPP', { locale: es })}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Notes Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-sierra-gray">Notas:</label>
                      {editingNotes !== file.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNotes(file.id, file.notes)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    {editingNotes === file.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="Agrega una nota para este archivo..."
                          className="min-h-[80px] text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveNotes(file.id)}
                            className="h-7 px-2 text-xs sierra-gradient"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Guardar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="h-7 px-2 text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="min-h-[60px] p-2 bg-sierra-teal/5 rounded text-sm text-sierra-gray border">
                        {file.notes || (
                          <span className="italic text-sierra-gray/60">
                            Sin notas. Haz clic en editar para agregar.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Download Button */}
                  <div className="pt-2">
                    <Button
                      onClick={() => downloadFile(file.drive_url, `${file.project_title}_informe_IA`)}
                      className="w-full sierra-gradient hover:opacity-90 transition-opacity"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Informe IA
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedFiles;
