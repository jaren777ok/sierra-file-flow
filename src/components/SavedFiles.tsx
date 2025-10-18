
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { Download, Search, FileText, Calendar, RefreshCw, Edit2, Save, X, ArrowLeft, FolderOpen, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const SavedFiles = () => {
  const { files, loading, fetchSavedFiles, downloadFile, updateFileNotes } = useSavedFiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-gradient-to-br from-sierra-mint via-white to-stone-50 dark:from-background dark:to-background p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 sierra-teal-gradient rounded-full blur-xl opacity-50 animate-pulse" />
                <RefreshCw className="h-16 w-16 text-[hsl(var(--sierra-teal))] animate-spin mx-auto relative z-10" />
              </div>
              <h3 className="text-2xl font-bold sierra-teal-gradient bg-clip-text text-transparent">Cargando archivos...</h3>
              <p className="text-muted-foreground">Obteniendo tus archivos guardados</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sierra-mint via-white to-stone-50 dark:from-background dark:to-background p-4 md:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header with Back Button */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="default"
              className="border-2 border-sierra-teal/30 text-[hsl(var(--sierra-teal))] hover:bg-[hsl(var(--sierra-teal))] hover:text-white hover:border-sierra-teal transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-sierra-teal/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Regresar al Dashboard
            </Button>
          </div>
          
          {/* Hero header */}
          <div className="relative overflow-hidden rounded-3xl mb-8 border-2 border-sierra-teal/10 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-card/80">
            <div className="absolute inset-0 sierra-teal-gradient opacity-5" />
            <div className="absolute top-10 right-10 w-64 h-64 sierra-teal-gradient rounded-2xl blur-xl opacity-50 animate-pulse-ring" />
            <div className="relative p-8 md:p-12">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 sierra-teal-gradient rounded-2xl blur-xl opacity-50 animate-pulse" />
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl sierra-teal-gradient flex items-center justify-center shadow-xl sierra-glow">
                    <FolderOpen className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl md:text-5xl font-bold text-foreground">
                      Archivos <span className="sierra-teal-gradient bg-clip-text text-transparent">Guardados</span>
                    </h1>
                    <Sparkles className="h-6 w-6 text-[hsl(var(--sierra-teal))] animate-pulse-glow" />
                  </div>
                  <p className="text-base md:text-lg text-muted-foreground">
                    Gestiona y descarga todos tus archivos procesados con IA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Refresh */}
        <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-sierra-teal/10 shadow-xl mb-8 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--sierra-teal))]" />
              <Input
                placeholder="Buscar por nombre de proyecto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base border-2 border-sierra-teal/20 focus:border-sierra-teal rounded-xl shadow-md focus:shadow-lg transition-all duration-300"
              />
            </div>

            <Button
              onClick={fetchSavedFiles}
              size="lg"
              className="sierra-teal-gradient text-white px-8 py-6 shadow-lg hover:shadow-xl hover:shadow-sierra-teal/30 hover:scale-105 transition-all duration-300 border-0 w-full md:w-auto font-semibold"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Files Grid */}
        {filteredFiles.length === 0 ? (
          <div className="bg-white/90 dark:bg-card/90 backdrop-blur-sm rounded-3xl border-2 border-sierra-teal/10 shadow-2xl p-12 md:p-16 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-sierra-mint to-sierra-teal/20 rounded-full blur-xl opacity-50" />
              <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-sierra-mint to-sierra-teal/30 flex items-center justify-center">
                <FileText className="h-12 w-12 text-[hsl(var(--sierra-teal))]" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {files.length === 0 ? 'No hay archivos guardados' : 'No se encontraron archivos'}
            </h3>
            <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto mb-6">
              {files.length === 0 
                ? 'Procesa algunos archivos para verlos aquí. Comienza subiendo tu primer proyecto.' 
                : 'Intenta con diferentes términos de búsqueda para encontrar tus archivos.'
              }
            </p>
            {files.length === 0 && (
              <Button onClick={() => navigate('/convert-audio')} className="sierra-teal-gradient text-white px-8 py-4 shadow-lg hover:shadow-xl hover:shadow-sierra-teal/30 hover:scale-105 transition-all duration-300 font-semibold">
                Procesar tu Primer Archivo
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredFiles.map((file) => (
              <div 
                key={file.id} 
                className="group bg-white/90 dark:bg-card/90 backdrop-blur-sm rounded-3xl border-2 border-sierra-teal/10 shadow-xl hover:shadow-2xl hover:shadow-sierra-teal/10 transition-all duration-300 hover:scale-[1.02] hover:border-sierra-teal/40 overflow-hidden"
              >
                {/* Card Header with gradient accent */}
                <div className="relative p-6 pb-4">
                  <div className="absolute top-0 right-0 w-32 h-32 sierra-teal-gradient opacity-5 rounded-bl-full" />
                  <div className="relative flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl sierra-teal-gradient flex items-center justify-center flex-shrink-0 shadow-lg sierra-glow group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-1 group-hover:text-[hsl(var(--sierra-teal))] transition-colors duration-300">
                        {file.project_title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{format(new Date(file.created_at), 'PPP', { locale: es })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 pb-6 space-y-4">
                  {/* Area Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1 text-sm font-semibold bg-gradient-to-r from-sierra-mint to-sierra-teal/20 text-[hsl(var(--sierra-teal))] border-0">
                      {file.area}
                    </Badge>
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Edit2 className="h-4 w-4 text-[hsl(var(--sierra-teal))]" />
                        Notas:
                      </span>
                      {editingNotes !== file.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNotes(file.id, file.notes)}
                          className="h-9 w-9 p-2 hover:bg-[hsl(var(--sierra-teal))]/10 rounded-lg transition-colors duration-300"
                        >
                          <Edit2 className="h-4 w-4 text-[hsl(var(--sierra-teal))]" />
                        </Button>
                      )}
                    </div>
                    
                    {editingNotes === file.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Agregar una nota sobre este archivo..."
                          className="min-h-[80px] text-sm border-2 border-sierra-teal/20 focus:border-sierra-teal rounded-xl resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveNotes(file.id)}
                            className="flex-1 sierra-teal-gradient text-white border-0 shadow-md hover:shadow-lg hover:shadow-sierra-teal/30 transition-all duration-300"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all duration-300"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-sierra-mint/50 dark:bg-[hsl(var(--sierra-teal))]/5 p-3 rounded-xl border border-sierra-teal/10 min-h-[60px]">
                        <p className="text-sm text-foreground/80">
                          {file.notes || 'Sin notas añadidas'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Download Button */}
                  <Button
                    onClick={() => downloadFile(file.drive_url, file.project_title)}
                    size="lg"
                    className="w-full sierra-neon-gradient text-white py-6 shadow-lg hover:shadow-xl hover:shadow-sierra-teal/40 hover:scale-[1.02] transition-all duration-300 border-0 font-semibold"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Descargar Archivo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedFiles;
