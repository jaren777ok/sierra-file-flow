

## Plan: Corregir Numeración de Listas Ordenadas al Dividir entre Páginas

### Problema Identificado

Cuando el contenido Markdown con listas numeradas (1, 2, 3, 4, 5, 6...) se divide entre páginas, cada nueva página reinicia la numeración desde 1 en lugar de continuar.

**Causa raíz**: En la función `divideContentIntoPages()`, cuando se crea un nuevo `<ol>` en una página siguiente, no se incluye el atributo `start` con el número correcto.

### Datos del Markdown Original (de tus capturas)

```
1. **Tópico: Estrategia y Planificación Comercial**
2. **Tópico: Herramientas Tecnológicas**  
3. **Tópico: Gestión de Cotizaciones y Precios**
4. **Tópico: Desarrollo de Habilidades y Capacitación**
5. **Tópico: KPIs y Medición de Desempeño**
6. **Tópico: Marketing y Visibilidad de Marca**
```

### Cómo se ve Actualmente (Incorrecto)

| Página 14 | Página 15 | Página 16 |
|-----------|-----------|-----------|
| 1. Tópico: Estrategia... | 1. Tópico: Gestión... | 1. Tópico: KPIs... |
| 2. Tema: Herramientas... | 2. Tópico: Desarrollo... | 2. Tópico: Marketing... |

### Cómo Debería Verse (Correcto)

| Página 14 | Página 15 | Página 16 |
|-----------|-----------|-----------|
| 1. Tópico: Estrategia... | 3. Tópico: Gestión... | 5. Tópico: KPIs... |
| 2. Tema: Herramientas... | 4. Tópico: Desarrollo... | 6. Tópico: Marketing... |

---

### Solución Técnica

#### Archivo a Modificar: `src/pages/SimpleWordEditor.tsx`

Modificar la sección de procesamiento de listas (líneas 315-347) para:

1. **Preservar el atributo `start` original** del `<ol>` si existe
2. **Rastrear el índice del item actual** durante la iteración
3. **Calcular el valor `start` correcto** cuando se crea un nuevo `<ol>` en página siguiente

#### Código Actual (Problemático)

```typescript
// === LISTS: Process ITEM BY ITEM ===
if (tagName === 'ul' || tagName === 'ol') {
  const items = Array.from(element.querySelectorAll(':scope > li'));
  let listStarted = false;

  for (const item of items) {
    // ...medición de altura...
    
    if (currentHeightPx + itemHeightPx > MAX_HEIGHT_PX) {
      if (listStarted) {
        currentPageHtml += `</${tagName}>`;
      }
      savePage();

      // ❌ PROBLEMA: No tiene atributo start
      currentPageHtml = `<${tagName}>${itemHtml}`;
      // ...
    } else {
      if (!listStarted) {
        // ❌ PROBLEMA: No preserva start original
        currentPageHtml += `<${tagName}>`;
        listStarted = true;
      }
      // ...
    }
  }
}
```

#### Código Corregido

```typescript
// === LISTS: Process ITEM BY ITEM ===
if (tagName === 'ul' || tagName === 'ol') {
  const items = Array.from(element.querySelectorAll(':scope > li'));
  let listStarted = false;
  
  // Para <ol>: obtener el start original (default 1) y rastrear índice actual
  const isOrderedList = tagName === 'ol';
  const originalStart = isOrderedList 
    ? parseInt(element.getAttribute('start') || '1', 10) 
    : 1;
  let currentItemIndex = 0; // Índice dentro del array de items

  for (const item of items) {
    const itemHtml = (item as HTMLElement).outerHTML;
    const itemHeightPx = measureListItemHeightPx(item as HTMLElement, CONTENT_WIDTH);

    if (currentHeightPx + itemHeightPx > MAX_HEIGHT_PX) {
      if (listStarted) {
        currentPageHtml += `</${tagName}>`;
      }
      savePage();

      // ✅ SOLUCIÓN: Calcular start correcto para la nueva página
      const startAttr = isOrderedList 
        ? ` start="${originalStart + currentItemIndex}"` 
        : '';
      currentPageHtml = `<${tagName}${startAttr}>${itemHtml}`;
      currentHeightPx = itemHeightPx;
      listStarted = true;
    } else {
      if (!listStarted) {
        // ✅ SOLUCIÓN: Preservar start original en primera página
        const startAttr = isOrderedList && originalStart !== 1 
          ? ` start="${originalStart}"` 
          : '';
        currentPageHtml += `<${tagName}${startAttr}>`;
        listStarted = true;
      }
      currentPageHtml += itemHtml;
      currentHeightPx += itemHeightPx;
    }
    
    currentItemIndex++; // Incrementar después de procesar cada item
  }

  if (listStarted) {
    currentPageHtml += `</${tagName}>`;
  }
  continue;
}
```

---

### Lógica de la Solución

| Variable | Propósito |
|----------|-----------|
| `isOrderedList` | Detecta si es `<ol>` (necesita `start`) o `<ul>` (no lo necesita) |
| `originalStart` | Valor inicial del atributo `start` (1 por defecto) |
| `currentItemIndex` | Contador de items procesados (0, 1, 2, 3...) |
| `startAttr` | Atributo HTML a insertar: `start="3"` |

### Ejemplo de Flujo

```
Markdown: 1. Tópico A, 2. Tópico B, 3. Tópico C, 4. Tópico D

originalStart = 1
currentItemIndex = 0, 1, 2, 3

Página 1 (items 0, 1 caben):
  <ol>              ← sin start (1 es default)
    <li>Tópico A</li>  ← index 0, muestra "1."
    <li>Tópico B</li>  ← index 1, muestra "2."
  </ol>

Página 2 (items 2, 3):
  <ol start="3">    ← start = originalStart(1) + currentItemIndex(2) = 3
    <li>Tópico C</li>  ← muestra "3."
    <li>Tópico D</li>  ← muestra "4."
  </ol>
```

---

### Resumen de Cambios

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `src/pages/SimpleWordEditor.tsx` | 315-347 | Agregar lógica de `start` para listas ordenadas divididas |

### Resultado Esperado

Después de aplicar el fix:
- Cada `<ol>` dividido tendrá el atributo `start` correcto
- La numeración fluirá naturalmente entre páginas (1, 2 → 3, 4 → 5, 6...)
- Las listas no ordenadas (`<ul>`) no se ven afectadas
- El renderizado visual coincidirá con el Markdown original

