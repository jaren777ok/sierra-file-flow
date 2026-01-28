
## Plan: Reemplazar Imagen de Fondo del Editor Word

### Resumen

Reemplazaremos la imagen de fondo corporativa del SimpleWordEditor (`FONDO_A4.png`) por la nueva imagen (`FONDO_A4-3.png`) que incluye los logos OSIRIS y LOGISTIC LAW actualizados.

### Cambios a Realizar

| Paso | Archivo | Accion |
|------|---------|--------|
| 1 | `src/assets/FONDO_A4-3.png` | Copiar nueva imagen al proyecto |
| 2 | `src/pages/SimpleWordEditor.tsx` | Actualizar import de imagen |

### Detalles Tecnicos

**Paso 1: Agregar la nueva imagen**
```
Copiar: user-uploads://FONDO_A4-3.png → src/assets/FONDO_A4-3.png
```

**Paso 2: Actualizar import en SimpleWordEditor.tsx (linea 10)**
```typescript
// ANTES:
import fondoA4Image from '@/assets/FONDO_A4.png';

// DESPUES:
import fondoA4Image from '@/assets/FONDO_A4-3.png';
```

### Funcionalidades Preservadas

El cambio es minimo y no afecta ninguna funcionalidad:

| Funcionalidad | Estado |
|---------------|--------|
| Renderizado de paginas A4 | Sin cambios |
| Exportacion PDF con fondo | Sin cambios |
| Edicion de contenido | Sin cambios |
| Paginacion automatica | Sin cambios |
| Guardado en Supabase | Sin cambios |
| Copia con formato | Sin cambios |

### Resultado Visual

La nueva imagen de fondo mostrara:
- Logo OSIRIS (esquina superior izquierda)
- Logo LOGISTIC LAW (esquina superior derecha)  
- Fondo blanco limpio para el contenido

Esto aplicara automaticamente a:
- Todas las paginas del editor Word
- Todos los PDFs generados
