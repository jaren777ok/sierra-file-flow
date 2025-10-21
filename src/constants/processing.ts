export const PROCESSING_CONSTANTS = {
  WEBHOOK_URL: "https://cris.cloude.es/webhook/sierra",
  MAX_TIMEOUT: 900000, // 15 minutos en milisegundos
  POLLING_INTERVAL: 10000, // 10 segundos entre consultas
  MAX_POLLING_TIME: 20 * 60 * 1000, // 20 minutos máximo de polling
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
