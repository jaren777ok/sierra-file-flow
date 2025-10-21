export const PROCESSING_CONSTANTS = {
  WEBHOOK_URL: "https://cris.cloude.es/webhook/sierra",
  MAX_TIMEOUT: 900000, // 15 minutos en milisegundos
  POLLING_INTERVAL: 60000, // 1 minuto entre consultas (60 segundos)
  MAX_POLLING_TIME: 15 * 60 * 1000, // 15 minutos máximo de polling
  AREAS: ["comercial", "operaciones", "pricing", "administracion"] as const,
  PROGRESS_STEPS: {
    INITIAL: 5,
    SENDING: 10,
    PROCESSING: 20,
    ANALYZING: 50,
    GENERATING: 80,
    COMPLETED: 100,
  },
} as const;
