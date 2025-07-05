
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { Download, Search, FileText, Calendar, RefreshCw, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SavedFiles = () => {
  const { files, loading, fetchSavedFiles, downloadFile, updateFileNotes } = useSavedFiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const filteredFiles = files.filter(file => 
    file.project_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditNotes = (fileId: string, currentNotes: string) => {
    setEditingNotes(fileId);
    setNoteText(currentNotes || '');
  };

  const handleSaveNotes = async (fileId: string) => {
    await updateFileNotes(fileId, noteText);
    setEditingNotes(null);
    setNoteText('');
  };

  const handleCancelEdit = () => {
    setEditingNotes(null);
    setNoteText('');
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

        {/* Search and Refresh */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-sierra-gray" />
                <Input
                  placeholder="Buscar por proyecto..."
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
              <Card key={file.id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-200 hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-sierra-teal line-clamp-2">
                    {file.project_title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-sierra-gray">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(file.created_at), 'PPP', { locale: es })}
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-sierra-gray">Notas:</span>
                      {editingNotes !== file.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNotes(file.id, file.notes)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    {editingNotes === file.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Agregar una nota..."
                          className="min-h-[60px] text-xs"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleSaveNotes(file.id)}
                            className="h-6 px-2 text-xs sierra-gradient"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-6 px-2 text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-sierra-gray bg-gray-50 p-2 rounded min-h-[40px]">
                        {file.notes || 'Sin notas'}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => downloadFile(file.drive_url, file.project_title)}
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
      </div>
    </div>
  );
};

export default SavedFiles;
