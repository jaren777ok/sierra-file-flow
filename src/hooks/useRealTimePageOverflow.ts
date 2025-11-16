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
    
    // Medir altura REAL del contenido
    const contentHeight = element.scrollHeight;
    const paddingTop = 700; // según CSS
    const paddingBottom = 150; // según CSS
    const actualContentHeight = contentHeight - paddingTop - paddingBottom;
    
    console.log(`📏 Page ${pageIndex}: ${actualContentHeight}px / ${maxContentHeight}px`);
    
    // Agregar clases visuales según porcentaje
    const percentage = (actualContentHeight / maxContentHeight) * 100;
    element.classList.remove('near-limit', 'at-limit');
    if (percentage > 90) element.classList.add('near-limit');
    if (percentage > 98) element.classList.add('at-limit');
    
    // Si excede el 95% del límite, dividir
    if (actualContentHeight > maxContentHeight * 0.95) {
      setIsProcessing(true);
      splitPage(pageIndex);
      setTimeout(() => setIsProcessing(false), 100);
    }
  }, [maxContentHeight, isProcessing]);

  const splitPage = useCallback((pageIndex: number) => {
    const element = pageRefs.current.get(pageIndex);
    if (!element || element.children.length === 0) return;
    
    const children = Array.from(element.children);
    const newPages = [...pages];
    
    // Algoritmo de división inteligente
    let currentHeight = 0;
    let splitIndex = children.length;
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childHeight = child.offsetHeight;
      
      // Si agregar este elemento excede el límite
      if (currentHeight + childHeight > maxContentHeight) {
        splitIndex = i;
        break;
      }
      
      currentHeight += childHeight;
    }
    
    // No dividir si solo hay 1 elemento (evitar loop infinito)
    if (splitIndex <= 0) splitIndex = 1;
    
    // Contenido que se queda en la página actual
    const keepContent = children.slice(0, splitIndex)
      .map(child => child.outerHTML)
      .join('');
    
    // Contenido que se mueve a la siguiente página
    const moveContent = children.slice(splitIndex)
      .map(child => child.outerHTML)
      .join('');
    
    // Actualizar página actual
    newPages[pageIndex] = keepContent;
    
    // Crear nueva página o agregar a la siguiente
    if (pageIndex + 1 < newPages.length) {
      newPages[pageIndex + 1] = moveContent + newPages[pageIndex + 1];
    } else {
      newPages.push(moveContent);
    }
    
    console.log(`✂️ Split page ${pageIndex}: ${splitIndex}/${children.length} elements`);
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
