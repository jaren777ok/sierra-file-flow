import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSavedFiles } from '@/hooks/useSavedFiles';
import { FileText, Search, Calendar, RefreshCw, ArrowLeft, FolderOpen, Sparkles, FileEdit, Presentation } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const SavedFiles = () => {
  const { files, loading, fetchSavedFiles } = useSavedFiles();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredFiles = files.filter(file => 
    file.project_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          
          {/* Search and Refresh */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar por nombre de proyecto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-2 border-sierra-teal/20 focus:border-sierra-teal rounded-xl shadow-md focus:shadow-xl focus:shadow-sierra-teal/20 transition-all duration-300"
              />
            </div>
            <Button
              onClick={fetchSavedFiles}
              size="lg"
              variant="outline"
              className="border-2 border-sierra-teal/30 text-[hsl(var(--sierra-teal))] hover:bg-[hsl(var(--sierra-teal))] hover:text-white hover:border-sierra-teal transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-sierra-teal/20 h-12"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* No Files Message */}
        {filteredFiles.length === 0 && (
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 sierra-teal-gradient rounded-3xl blur-2xl opacity-30 animate-pulse" />
              <div className="relative w-24 h-24 rounded-3xl sierra-teal-gradient/10 flex items-center justify-center border-2 border-sierra-teal/20">
                <FolderOpen className="h-12 w-12 text-[hsl(var(--sierra-teal))]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">No hay archivos guardados</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {searchTerm 
                ? 'No se encontraron archivos que coincidan con tu búsqueda.' 
                : 'Aún no has procesado ningún archivo. ¡Comienza subiendo algunos archivos!'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigate('/')}
                size="lg"
                className="sierra-teal-gradient text-white border-0 shadow-xl hover:shadow-2xl hover:shadow-sierra-teal/40 transition-all duration-300"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Ir al Dashboard
              </Button>
            )}
          </div>
        )}

        {/* Files Grid */}
        {filteredFiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredFiles.map((file) => (
              <div 
                key={file.id}
                className="group relative bg-white dark:bg-card rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-sierra-teal/30 overflow-hidden animate-fade-in"
              >
                <div className="absolute inset-0 sierra-teal-gradient opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                
                <div className="relative">
                  {/* Header Section */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 sierra-teal-gradient rounded-xl blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
                        <div className="relative w-12 h-12 rounded-xl sierra-teal-gradient flex items-center justify-center shadow-md">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-foreground mb-2 truncate group-hover:text-[hsl(var(--sierra-teal))] transition-colors">
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
                    {/* File Info Badge */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-3 py-1 text-sm font-semibold bg-gradient-to-r from-sierra-mint to-sierra-teal/20 text-[hsl(var(--sierra-teal))] border-0">
                        {file.total_files} archivo{file.total_files > 1 ? 's' : ''} procesado{file.total_files > 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate(`/simple-word/${file.id}`)}
                        size="lg"
                        className="w-full sierra-teal-gradient text-white border-0 shadow-lg hover:shadow-xl hover:shadow-sierra-teal/30 transition-all duration-300 group/btn"
                      >
                        <FileEdit className="h-5 w-5 mr-2 transition-transform group-hover/btn:scale-110" />
                        ABRIR EN WORD
                      </Button>
                      
                      <Button
                        onClick={() => navigate(`/simple-ppt/${file.id}`)}
                        size="lg"
                        variant="outline"
                        className="w-full border-2 border-sierra-teal/30 text-[hsl(var(--sierra-teal))] hover:bg-[hsl(var(--sierra-teal))] hover:text-white hover:border-sierra-teal transition-all duration-300 group/btn"
                      >
                        <Presentation className="h-5 w-5 mr-2 transition-transform group-hover/btn:scale-110" />
                        ABRIR PPT
                      </Button>
                    </div>
                  </div>
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
