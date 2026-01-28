
## Plan: Corregir Sincronización de Íconos entre StepIndicator y FileUploadStep

### Problema Identificado

Después de analizar el código, he encontrado **dos problemas**:

1. **Íconos duplicados**: Tanto "Análisis" como "Administración" usan el mismo emoji 📊, causando confusión visual.

2. **Posible desincronización de índices**: Cuando `stepConfig` cambia dinámicamente (al agregar/quitar archivos de empresa), el `currentStep` (número) puede desincronizarse con el contenido esperado.

### Diagnóstico Visual

En la imagen que compartiste:
- El StepIndicator muestra "Admin" con un ícono
- El contenido muestra "Área Administración" con un ícono grande
- El usuario reporta que estos no coinciden

### Solución Propuesta

#### Cambio 1: Usar íconos únicos para cada paso

Actualizar los íconos para que no haya duplicados:

| Paso | Ícono Actual | Ícono Nuevo |
|------|--------------|-------------|
| Análisis | 📊 | 📈 (gráfico de línea) |
| Comercial | 💼 | 💼 (sin cambio) |
| Operaciones | ⚙️ | ⚙️ (sin cambio) |
| Pricing | 💰 | 💰 (sin cambio) |
| Administración | 📊 | 🗂️ (archivo/carpeta) |

#### Cambio 2: Garantizar sincronización usando `currentStepKey`

En lugar de depender del índice numérico `currentStep` para el StepIndicator, pasar también el `currentStepKey` para una verificación más robusta:

```typescript
// StepIndicator.tsx - Nueva lógica
const currentVisibleStep = visibleSteps.find(s => s.key === currentStepKey);
const currentVisualIndex = currentVisibleStep 
  ? visibleSteps.indexOf(currentVisibleStep)
  : getVisualIndex(currentStep);
```

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useMultiStepUpload.ts` | Actualizar íconos en `areas` y `stepConfig` para que sean únicos |
| `src/components/upload-steps/StepIndicator.tsx` | Agregar prop `currentStepKey` y usar para verificación de sincronización |
| `src/components/MultiStepUploader.tsx` | Pasar `currentStepKey` al StepIndicator |
| `src/pages/Index.tsx` | Actualizar ícono de Administración para consistencia |

### Detalles Técnicos

**Cambio en `useMultiStepUpload.ts`:**

```typescript
// areas (líneas 41-46)
const areas = useMemo(() => [
  { key: 'comercial', name: 'Comercial', icon: '💼' },
  { key: 'operaciones', name: 'Operaciones', icon: '⚙️' },
  { key: 'pricing', name: 'Pricing', icon: '💰' },
  { key: 'administracion', name: 'Administración', icon: '🗂️' } // Cambio de 📊 a 🗂️
], []);

// stepConfig (líneas 59-68)
if (hasAnalysis) {
  steps.push({ key: 'analysis_review', name: 'Análisis', icon: '📈' }); // Cambio de 📊 a 📈
}
steps.push(
  { key: 'comercial', name: 'Comercial', icon: '💼' },
  { key: 'operaciones', name: 'Operaciones', icon: '⚙️' },
  { key: 'pricing', name: 'Pricing', icon: '💰' },
  { key: 'administracion', name: 'Admin', icon: '🗂️' } // Cambio de 📊 a 🗂️
);
```

**Cambio en `StepIndicator.tsx`:**

Agregar nuevo prop y lógica de verificación:

```typescript
interface StepIndicatorProps {
  currentStep: number;
  stepConfig: StepConfig[];
  currentStepKey?: string; // Nuevo prop
}

const StepIndicator = ({ currentStep, stepConfig, currentStepKey }: StepIndicatorProps) => {
  // ...existing code...

  // Calcular índice visual usando stepKey para mayor precisión
  const getCurrentVisualIndex = () => {
    if (currentStepKey) {
      const visibleIndex = visibleSteps.findIndex(s => s.key === currentStepKey);
      if (visibleIndex >= 0) return visibleIndex;
    }
    return getVisualIndex(currentStep);
  };

  const currentVisualIndex = getCurrentVisualIndex();
  // ...rest of component...
};
```

**Cambio en `MultiStepUploader.tsx`:**

```typescript
<StepIndicator 
  currentStep={currentStep} 
  stepConfig={stepConfig}
  currentStepKey={currentStepKey} // Nuevo prop
/>
```

### Resultado Esperado

1. Cada área tendrá un ícono visualmente único
2. El StepIndicator siempre mostrará el paso correcto como "actual" incluso si los índices cambian
3. El ícono grande en el contenido siempre coincidirá con el ícono en la barra de progreso

### Flujo Visual Después del Fix

```
StepIndicator:  📝 → 🏢 → 📈 → 💼 → ⚙️ → 💰 → 🗂️ → 👁️
                Proy  Emp  Anál  Com  Oper  Pric  Admin Rev

Contenido:      🗂️ Área Administración ← Siempre sincronizado
```
