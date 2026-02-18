

## Plan: Corregir Desincronización de Nombres e Iconos en Pasos de Carga

### Problema Raíz

El estado `currentStep` se guarda como un **indice numerico** (0, 1, 2, 3...), pero la lista de pasos `stepConfig` es **dinamica** (cambia cuando se agregan archivos de empresa o areas personalizadas). Cuando stepConfig cambia, el indice numerico apunta al paso equivocado.

```text
SIN archivos empresa:          CON archivos empresa:
Index 0 = Proyecto             Index 0 = Proyecto
Index 1 = Empresa              Index 1 = Empresa
Index 2 = Comercial  <--       Index 2 = Analizando
Index 3 = Operaciones          Index 3 = Analisis
Index 4 = Pricing              Index 4 = Comercial  <-- MISMO INDEX, DISTINTO PASO
Index 5 = Admin                Index 5 = Operaciones
Index 6 = Revision             Index 6 = Pricing
                               Index 7 = Admin
                               Index 8 = Revision
```

Si el usuario esta en index 4 y agrega/quita archivos de empresa, el nombre e icono cambian porque el index ahora apunta a otro paso.

### Solucion: Usar stepKey como Estado Principal

En lugar de guardar un numero, guardar la **clave del paso** (string como "pricing", "comercial", etc.). El indice numerico se deriva automaticamente.

### Cambios en un Solo Archivo

**Archivo: `src/hooks/useMultiStepUpload.ts`**

1. Cambiar `currentStep` de `number` a `string` (stepKey)
2. Derivar el indice numerico a partir del stepKey + stepConfig
3. Todas las funciones (`nextStep`, `prevStep`, `goToStep`, etc.) trabajan con keys en vez de indices

```typescript
// ANTES (problematico):
const [currentStep, setCurrentStep] = useState(0);  // indice numerico
const currentStepKey = stepConfig[currentStep]?.key || '';

// DESPUES (robusto):
const [currentStepKey, setCurrentStepKey] = useState('project');  // clave del paso
const currentStep = stepConfig.findIndex(s => s.key === currentStepKey);
```

#### Funciones Actualizadas:

```typescript
// nextStep: avanza al siguiente key
const nextStep = useCallback(() => {
  const currentIndex = stepConfig.findIndex(s => s.key === currentStepKey);
  if (currentIndex < stepConfig.length - 1) {
    setCurrentStepKey(stepConfig[currentIndex + 1].key);
  }
}, [currentStepKey, stepConfig]);

// prevStep: retrocede al key anterior
const prevStep = useCallback(() => {
  const currentIndex = stepConfig.findIndex(s => s.key === currentStepKey);
  if (currentIndex > 0) {
    setCurrentStepKey(stepConfig[currentIndex - 1].key);
  }
}, [currentStepKey, stepConfig]);

// goToStep: ya funciona con keys, simplificar
const goToStep = useCallback((stepKey: string) => {
  setCurrentStepKey(stepKey);
}, []);

// setCurrentStep numerico (para compatibilidad):
const setCurrentStepByIndex = useCallback((index: number) => {
  if (stepConfig[index]) {
    setCurrentStepKey(stepConfig[index].key);
  }
}, [stepConfig]);
```

### Otros Ajustes Menores

- `jumpToProcessing`: cambia a `setCurrentStepKey('processing')`
- `resetFlow`: cambia a `setCurrentStepKey('project')`
- Los valores exportados se mantienen iguales (currentStep sigue siendo un numero derivado, currentStepKey es el string)
- `MultiStepUploader.tsx` y `StepIndicator.tsx` no necesitan cambios porque ya usan `currentStepKey`

### Resultado

- No importa cuantas veces cambie `stepConfig`, el paso activo siempre mantiene su identidad
- Si el usuario esta en "pricing", vera "Pricing" con el icono correcto aunque se agreguen o quiten pasos
- Sin tablas nuevas en la base de datos -- es un fix puramente de frontend
- Cero impacto en la funcionalidad existente

### Verificacion

1. Subir archivos de empresa (activa pasos de analisis) y verificar que los nombres de cada area son correctos
2. Navegar adelante y atras entre areas y confirmar icono + nombre correctos
3. Agregar area personalizada y verificar que no desincroniza las demas
