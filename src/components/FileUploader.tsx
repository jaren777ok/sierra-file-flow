import React, { useState, useCallback } from "react";
import { Upload, File, CheckCircle, AlertCircle, X, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface FileUploadStatus {
  file: File;
  status: "uploading" | "processing" | "completed" | "ready-for-download" | "error";
  progress: number;
  message?: string;
  processedFile?: Blob;
  downloadUrl?: string;
  originalFileName?: string;
}

const FileUploader = () => {
  const [files, setFiles] = useState<FileUploadStatus[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const WEBHOOK_URL = "https://n8n.srv891024.hstgr.cloud/webhook/sierra";
  const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutos

  const uploadFile = async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9);

    const newFileStatus: FileUploadStatus = {
      file,
      status: "uploading",
      progress: 0,
      originalFileName: file.name,
    };

    setFiles((prev) => [...prev, newFileStatus]);

    try {
      // Actualizar progreso a 30%
      setFiles((prev) => prev.map((f) => (f.file === file ? { ...f, progress: 30 } : f)));

      // Crear FormData para enviar archivo binario
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);
      formData.append("fileSize", file.size.toString());
      formData.append("fileType", file.type);
      formData.append("timestamp", new Date().toISOString());
      formData.append("id", fileId);

      // Actualizar progreso a 50%
      setFiles((prev) => prev.map((f) => (f.file === file ? { ...f, progress: 50, status: "processing" } : f)));

      console.log("Enviando archivo a webhook:", WEBHOOK_URL);

      // Crear promesa con timeout
      const uploadPromise = fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: La operación tardó más de 15 minutos")), TIMEOUT_DURATION);
      });

      // Ejecutar con timeout
      const response = (await Promise.race([uploadPromise, timeoutPromise])) as Response;

      if (response.ok) {
        // Verificar el tipo de contenido de la respuesta
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          // Respuesta JSON - workflow iniciado, continuar procesando
          const jsonResponse = await response.json();
          console.log("Respuesta JSON recibida:", jsonResponse);

          setFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? {
                    ...f,
                    progress: 75,
                    status: "processing",
                    message: "Procesando archivo con IA...",
                  }
                : f,
            ),
          );

          // Aquí podrías implementar polling si es necesario
          // Por ahora, simularemos que el procesamiento continúa
          setTimeout(() => {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? {
                      ...f,
                      progress: 100,
                      status: "completed",
                      message: "Procesamiento completado. Esperando archivo procesado...",
                    }
                  : f,
              ),
            );
          }, 2000);
        } else {
          // Respuesta binaria - archivo procesado recibido
          const processedBlob = await response.blob();
          const downloadUrl = URL.createObjectURL(processedBlob);

          // Obtener el nombre del archivo desde los headers o usar uno por defecto
          const contentDisposition = response.headers.get("content-disposition");
          let processedFileName = file.name.replace(/\.[^/.]+$/, "_processed$&");

          if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (fileNameMatch) {
              processedFileName = fileNameMatch[1].replace(/['"]/g, "");
            }
          }

          setFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? {
                    ...f,
                    progress: 100,
                    status: "ready-for-download",
                    message: "Archivo procesado y listo para descargar",
                    processedFile: processedBlob,
                    downloadUrl: downloadUrl,
                  }
                : f,
            ),
          );

          toast({
            title: "¡Archivo Procesado!",
            description: `${file.name} ha sido procesado por IA y está listo para descargar.`,
          });
        }
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error("Error al subir archivo:", error);

      const errorMessage = error instanceof Error ? error.message : "Error desconocido";

      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? {
                ...f,
                status: "error",
                message: errorMessage,
              }
            : f,
        ),
      );

      toast({
        title: "Error",
        description: `Error al procesar ${file.name}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const downloadProcessedFile = (fileStatus: FileUploadStatus) => {
    if (fileStatus.downloadUrl && fileStatus.originalFileName) {
      const link = document.createElement("a");
      link.href = fileStatus.downloadUrl;
      link.download = fileStatus.originalFileName.replace(/\.[^/.]+$/, "_processed$&");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Descarga Iniciada",
        description: "El archivo procesado se está descargando.",
      });
    }
  };

  const removeFile = (fileToRemove: File) => {
    // Limpiar URL de objeto si existe para evitar memory leaks
    const fileStatus = files.find((f) => f.file === fileToRemove);
    if (fileStatus && fileStatus.downloadUrl) {
      URL.revokeObjectURL(fileStatus.downloadUrl);
    }

    setFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(uploadFile);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(uploadFile);
    e.target.value = "";
  };

  const getStatusIcon = (status: FileUploadStatus["status"]) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Clock className="h-5 w-5 text-sierra-brown animate-pulse" />;
      case "completed":
      case "ready-for-download":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: FileUploadStatus["status"]) => {
    switch (status) {
      case "uploading":
        return "bg-blue-500";
      case "processing":
        return "bg-sierra-brown";
      case "completed":
      case "ready-for-download":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
    }
  };

  const getStatusText = (status: FileUploadStatus["status"]) => {
    switch (status) {
      case "uploading":
        return "Subiendo...";
      case "processing":
        return "Procesando con IA...";
      case "completed":
        return "Procesamiento completado";
      case "ready-for-download":
        return "Listo para descargar";
      case "error":
        return "Error";
    }
  };

  return (
    <div className="space-y-6">
      {/* Zona de carga */}
      <Card className="mountain-shadow">
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
              isDragOver
                ? "border-sierra-brown bg-sierra-brown/5 scale-105"
                : "border-gray-300 hover:border-sierra-brown hover:bg-sierra-brown/5"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <Upload className="mx-auto h-16 w-16 text-sierra-brown mb-4" />
            <h3 className="text-xl font-semibold text-sierra-brown mb-2">Arrastra tus archivos aquí</h3>
            <p className="text-sierra-gray mb-6">O haz clic para seleccionar archivos desde tu dispositivo</p>

            <input type="file" multiple onChange={handleFileSelect} className="hidden" id="file-upload" />

            <Button asChild className="sierra-gradient hover:opacity-90 transition-opacity">
              <label htmlFor="file-upload" className="cursor-pointer">
                Seleccionar Archivos
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <Card className="mountain-shadow">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-sierra-brown mb-4">Archivos en proceso</h3>

            <div className="space-y-4">
              {files.map((fileStatus, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <File className="h-8 w-8 text-sierra-brown flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{fileStatus.file.name}</p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(fileStatus.status)}
                        {fileStatus.status === "ready-for-download" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadProcessedFile(fileStatus)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileStatus.file)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <Progress value={fileStatus.progress} className="flex-1 h-2" />
                      <span className="text-xs text-gray-500 font-mono">{fileStatus.progress}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB • {getStatusText(fileStatus.status)}
                      </p>
                      {fileStatus.message && (
                        <p
                          className={`text-xs ${
                            fileStatus.status === "error"
                              ? "text-red-600"
                              : fileStatus.status === "ready-for-download"
                                ? "text-green-600"
                                : "text-sierra-brown"
                          }`}
                        >
                          {fileStatus.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUploader;
