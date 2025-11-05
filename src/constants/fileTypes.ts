// Tipos de archivos permitidos para subir
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

// String para el atributo accept del input
export const ACCEPTED_FILE_TYPES_STRING = '.pdf,.doc,.docx,.xls,.xlsx';

// Nombres legibles de los tipos de archivos
export const ACCEPTED_FILE_NAMES = 'PDF, Word (.doc, .docx) y Excel (.xls, .xlsx)';

// Validar si un archivo es del tipo permitido
export const isValidFileType = (file: File): boolean => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
  return validExtensions.includes(extension);
};
