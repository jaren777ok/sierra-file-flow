import { useEffect, useCallback, useRef, useState } from 'react';

interface UseRealTimePageOverflowProps {
  pages: string[];
  onPagesChange: (pages: string[]) => void;
  maxContentHeight: number; // 1150px para informe
}

export const useRealTimePageOverflow = ({
  pages,
  onPagesChange,
  maxContentHeight = 1150,
}: UseRealTimePageOverflowProps) => {
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observersRef = useRef<Map<number, MutationObserver>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);

  const registerPageRef = useCallback((index: number, element: HTMLDivElement | null) => {
    if (element) {
      pageRefs.current.set(index, element);
      
      // Crear MutationObserver para detectar cambios EN TIEMPO REAL
      const observer = new MutationObserver(() => {
        checkPageOverflow(index);
      });
      
      observer.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: false,
      });
      
      observersRef.current.set(index, observer);
    } else {
      // Cleanup
      const observer = observersRef.current.get(index);
      if (observer) {
        observer.disconnect();
        observersRef.current.delete(index);
      }
      pageRefs.current.delete(index);
    }
  }, []);

  const checkPageOverflow = useCallback((pageIndex: number) => {
    if (isProcessing) return; // Prevenir recursión
    
    const element = pageRefs.current.get(pageIndex);
    if (!element) return;
    
    // MEDICIÓN CORRECTA: scrollHeight ya incluye padding, debemos restar
    const scrollHeight = element.scrollHeight;
    const computedStyle = window.getComputedStyle(element);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);
    
    // Altura real del contenido SIN padding
    const actualContentHeight = scrollHeight - paddingTop - paddingBottom;
    
    console.log(`📏 Página ${pageIndex}:`);
    console.log(`   - scrollHeight total: ${scrollHeight}px`);
    console.log(`   - paddingTop: ${paddingTop}px`);
    console.log(`   - paddingBottom: ${paddingBottom}px`);
    console.log(`   - contenido real: ${actualContentHeight}px`);
    console.log(`   - límite máximo: ${maxContentHeight}px`);
    console.log(`   - porcentaje usado: ${(actualContentHeight / maxContentHeight * 100).toFixed(1)}%`);
    
    const percentage = (actualContentHeight / maxContentHeight) * 100;
    
    // Clases visuales
    element.classList.remove('near-limit', 'at-limit');
    if (percentage > 85) element.classList.add('near-limit');
    if (percentage > 95) element.classList.add('at-limit');
    
    // Solo dividir si REALMENTE excede el 98% (más conservador)
    if (percentage > 98) {
      console.log(`⚠️ EXCEDIÓ LÍMITE - Dividiendo página ${pageIndex}`);
      setIsProcessing(true);
      splitPage(pageIndex);
      setTimeout(() => setIsProcessing(false), 200);
    }
  }, [maxContentHeight, isProcessing]);

  const splitPage = useCallback((pageIndex: number) => {
    const element = pageRefs.current.get(pageIndex);
    if (!element || element.children.length === 0) return;
    
    const children = Array.from(element.children);
    const newPages = [...pages];
    
    console.log(`✂️ Intentando dividir página ${pageIndex} con ${children.length} elementos`);
    
    // Crear un div temporal para medir con precisión
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '945px'; // ancho real editable (1545 - 300 - 300)
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12pt';
    tempDiv.style.lineHeight = '1.8';
    document.body.appendChild(tempDiv);
    
    let accumulatedHeight = 0;
    let splitIndex = children.length;
    
    // Encontrar punto de división óptimo
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      
      // Clonar y medir altura real
      const clone = child.cloneNode(true) as HTMLElement;
      tempDiv.appendChild(clone);
      const childHeight = clone.offsetHeight;
      
      console.log(`   Elemento ${i}: ${child.tagName} - ${childHeight}px`);
      
      // Si agregar este elemento excede el 95% del límite
      if (accumulatedHeight + childHeight > maxContentHeight * 0.95) {
        splitIndex = i;
        console.log(`   ⚠️ Punto de división encontrado en elemento ${i}`);
        break;
      }
      
      accumulatedHeight += childHeight;
    }
    
    // Cleanup
    document.body.removeChild(tempDiv);
    
    // Validaciones
    if (splitIndex <= 0) {
      console.log(`   ⚠️ No se puede dividir - solo 1 elemento`);
      return;
    }
    
    if (splitIndex >= children.length) {
      console.log(`   ✅ No es necesario dividir - todo cabe`);
      return;
    }
    
    // Contenido que se queda
    const keepElements = children.slice(0, splitIndex);
    const keepContent = keepElements.map(child => child.outerHTML).join('');
    
    // Contenido que se mueve
    const moveElements = children.slice(splitIndex);
    const moveContent = moveElements.map(child => child.outerHTML).join('');
    
    console.log(`   ✂️ Manteniendo ${splitIndex} elementos en página actual`);
    console.log(`   ➡️ Moviendo ${moveElements.length} elementos a siguiente página`);
    
    // Actualizar páginas
    newPages[pageIndex] = keepContent;
    
    if (pageIndex + 1 < newPages.length) {
      newPages[pageIndex + 1] = moveContent + newPages[pageIndex + 1];
    } else {
      newPages.push(moveContent);
    }
    
    onPagesChange(newPages);
  }, [pages, maxContentHeight, onPagesChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observersRef.current.forEach(observer => observer.disconnect());
    };
  }, []);

  return { registerPageRef, pageRefs };
};
