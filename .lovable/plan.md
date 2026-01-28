
## Plan: Optimizar Distribución de Contenido para Eliminar Espacios en Blanco Excesivos

### Problema Identificado

El editor Word actual deja grandes espacios en blanco entre secciones porque:
1. **Encabezados se empujan completos** a la siguiente página cuando no caben, dejando huecos
2. **Márgenes de elementos sobrestimados** en la medición, causando saltos prematuros
3. **No hay "look-ahead"** para decisiones inteligentes de división
4. **Buffer de seguridad muy conservador** (30px) que desperdicia espacio

### Datos del Sistema Actual

```text
+-----------------------------------------+
| CONSTANTES ACTUALES                     |
+-----------------------------------------+
| PAGE_HEIGHT    = 1122px                 |
| PADDING_TOP    = 120px  (logos)         |
| PADDING_BOTTOM = 60px   (footer)        |
| CONTENT_HEIGHT = 942px                  |
| SAFETY_BUFFER  = 30px                   |
| MAX_HEIGHT_PX  = 896px  (capacidad)     |
+-----------------------------------------+
```

### Flujo Visual del Problema

```text
PÁGINA ACTUAL (con problema):
+---------------------------+
| [LOGOS]                   |
|---------------------------|
| Texto Texto Texto         |
| Texto Texto Texto         |
| ...                       |
| [espacio disponible: 200px]|
|                           | <- ¡ESPACIO DESPERDICIADO!
|                           |
|---------------------------|
| [FOOTER]                  |
+---------------------------+

PÁGINA SIGUIENTE:
+---------------------------+
| [LOGOS]                   |
|---------------------------|
| ## TÍTULO GRANDE          | <- Se empujó completo
| Texto Texto Texto         |
| ...                       |
+---------------------------+
```

### Solución Propuesta: Algoritmo de Llenado Óptimo

#### Cambio 1: Reducir el "look-ahead" para encabezados

Actualmente, si un H2 no cabe, se mueve completo. Propongo verificar si el encabezado **más un mínimo de contenido siguiente** caben:

```typescript
// Si el heading no cabe SOLO, pero SÍ cabe con el siguiente elemento pequeño,
// entonces es mejor mover ambos juntos a la siguiente página.
// Si no cabe nada más, empujar el heading.

// NUEVO: Solo empujar heading si quedan menos de 150px (6 líneas)
const MIN_USEFUL_SPACE = 150; // Mínimo para que valga la pena empujar contenido

if (currentHeightPx + headingHeightPx > MAX_HEIGHT_PX) {
  // Solo cerrar página si no hay espacio útil
  if (MAX_HEIGHT_PX - currentHeightPx < MIN_USEFUL_SPACE) {
    savePage();
  }
}
```

#### Cambio 2: Reducir márgenes de medición duplicados

Las funciones de medición **ya incluyen márgenes** pero después se agregan espacios extra. Eliminar duplicación:

```typescript
// ANTES (problema):
const marginTop = parseFloat(style.marginTop) || 0;
const marginBottom = parseFloat(style.marginBottom) || 0;
const height = clone.offsetHeight + marginTop + marginBottom;
// DESPUÉS: offsetHeight YA incluye márgenes computados
```

#### Cambio 3: Reducir SAFETY_BUFFER de 30px a 16px

El buffer de 30px es excesivo para un sistema que mide en DOM real:

```typescript
// ANTES:
const SAFETY_BUFFER = 30;
const MAX_HEIGHT_PX = 896;

// DESPUÉS:
const SAFETY_BUFFER = 16;
const MAX_HEIGHT_PX = 910; // +14px de capacidad útil
```

#### Cambio 4: Permitir que párrafos llenen espacio pequeño

Actualmente, si queda poco espacio, se empuja el párrafo completo. Propongo **siempre** intentar llenar:

```typescript
// ANTES:
if (spaceAvailablePx >= MIN_SPACE_PX) { // 72px mínimo
  // dividir párrafo
}

// DESPUÉS: Reducir a 48px (2 líneas)
const MIN_SPACE_PX = 48; // Solo necesitamos 2 líneas para justificar dividir
```

### Archivos a Modificar

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `src/pages/SimpleWordEditor.tsx` | 27-28 | Reducir `SAFETY_BUFFER` a 16px, aumentar `MAX_HEIGHT_PX` a 910px |
| `src/pages/SimpleWordEditor.tsx` | 247 | Reducir `MIN_SPACE_PX` de 72 a 48 |
| `src/pages/SimpleWordEditor.tsx` | 30-64 | Corregir medición de elementos para no duplicar márgenes |
| `src/pages/SimpleWordEditor.tsx` | 366-377 | Optimizar lógica de headings para no desperdiciar espacio |
| `src/index.css` | 221-253 | Reducir márgenes excesivos de h2/h3/h4 |

### Cambios en CSS (Márgenes más Compactos)

Reducir márgenes de headings para documentos más densos:

```css
/* ANTES */
.page-content-area h2 {
  margin: 20pt 0 10pt 0;  /* 30pt total */
}
.page-content-area h3 {
  margin: 14pt 0 8pt 0;   /* 22pt total */
}

/* DESPUÉS */
.page-content-area h2 {
  margin: 14pt 0 8pt 0;   /* 22pt total - reducción de 8pt */
}
.page-content-area h3 {
  margin: 10pt 0 6pt 0;   /* 16pt total - reducción de 6pt */
}
```

### Cambios en Algoritmo (SimpleWordEditor.tsx)

#### Función measureElementHeightPx corregida:

```typescript
const measureElementHeightPx = (element: HTMLElement, contentWidth: number): number => {
  // ... crear tempContainer ...
  
  const clone = element.cloneNode(true) as HTMLElement;
  tempContainer.appendChild(clone);
  
  void tempContainer.offsetHeight;
  
  // CORREGIDO: offsetHeight INCLUYE padding pero NO márgenes
  // Solo agregar márgenes UNA vez, no duplicar
  const style = window.getComputedStyle(clone);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  
  // La altura real es offsetHeight + márgenes externos
  const height = clone.offsetHeight + marginTop + marginBottom;
  document.body.removeChild(tempContainer);
  
  return height;
};
```

#### Lógica de headings optimizada:

```typescript
// === HEADINGS: Move complete but don't waste space ===
if (isHeading(tagName)) {
  const elementHeightPx = getElementHeightPx(element, CONTENT_WIDTH);
  const spaceRemaining = MAX_HEIGHT_PX - currentHeightPx;

  if (currentHeightPx + elementHeightPx > MAX_HEIGHT_PX) {
    // Solo crear nueva página si el espacio restante es muy pequeño
    // (menos de 100px = ~4 líneas = no vale la pena)
    if (spaceRemaining < 100) {
      savePage();
    }
    // Si hay espacio, pero no suficiente para el heading + algo útil,
    // también crear nueva página para evitar heading huérfano al final
    else if (spaceRemaining < elementHeightPx + 100) {
      savePage();
    }
  }

  currentPageHtml += element.outerHTML;
  currentHeightPx += elementHeightPx;
  continue;
}
```

### Resultado Visual Esperado

```text
ANTES (problema):               DESPUÉS (optimizado):
+------------------+            +------------------+
| Contenido        |            | Contenido        |
| Contenido        |            | Contenido        |
|                  | <- vacío   | ## Heading       |
|                  | <- vacío   | Más contenido    |
|                  | <- vacío   | Más contenido    |
+------------------+            +------------------+
| ## Heading       |            | Continúa...      |
| Más contenido    |            |                  |
+------------------+            +------------------+
```

### Impacto Estimado

| Métrica | Antes | Después |
|---------|-------|---------|
| Espacio útil por página | ~896px | ~910px (+1.5%) |
| Líneas por página | ~37 | ~38 |
| Páginas para 76 páginas doc | 76 | ~70-72 (-5-8%) |
| Espacios en blanco grandes | Frecuentes | Raros |

### Verificación Post-Implementación

1. Cargar un documento de 70+ páginas
2. Verificar que no hay páginas con más del 20% de espacio vacío al final
3. Verificar que los headings no quedan "huérfanos" sin contenido debajo
4. Verificar que el texto no se oculta ni se corta
5. Exportar a PDF y confirmar renderizado correcto
