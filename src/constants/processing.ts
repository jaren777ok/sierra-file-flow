export const PROCESSING_CONSTANTS = {
  WEBHOOK_URL: "https://cris.cloude.es/webhook/sierra",
  MAX_TIMEOUT: 900000, // 15 minutos en milisegundos
  POLLING_INTERVAL: 60000, // 1 minuto entre consultas (60 segundos)
  MAX_POLLING_TIME: 15 * 60 * 1000, // 15 minutos máximo de polling
  AREAS: ["comercial", "operaciones", "pricing", "administracion"] as const,
  MAX_FILES_PER_AREA: 10, // Aumentado de 5 a 10
  FIXED_AREAS: ["comercial", "operaciones", "pricing", "administracion"] as const,
  CUSTOM_AREA_ICONS: ['📁', '📂', '📊', '📋', '📝', '🗂️'] as const,
  PROGRESS_STEPS: {
    INITIAL: 5,
    SENDING: 10,
    PROCESSING: 20,
    ANALYZING: 50,
    GENERATING: 80,
    COMPLETED: 100,
  },
} as const;
