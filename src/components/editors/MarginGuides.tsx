import { useState, useEffect } from 'react';

interface MarginGuidesProps {
  pageWidth: number;
  leftMargin: number;
  rightMargin: number;
  rulerHeight: number;
  isDragging?: boolean;
}

export const MarginGuides = ({
  pageWidth,
  leftMargin,
  rightMargin,
  rulerHeight,
  isDragging = false,
}: MarginGuidesProps) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calcular posiciones considerando que las páginas están centradas
  const centerOffset = Math.max(0, (windowWidth - pageWidth) / 2);
  const leftLinePosition = centerOffset + leftMargin;
  const rightLinePosition = centerOffset + pageWidth - rightMargin;

  // Validar que las posiciones sean correctas
  if (leftLinePosition < 0 || rightLinePosition < 0 || leftLinePosition >= rightLinePosition) {
    return null;
  }

  // Solo mostrar líneas cuando se está arrastrando
  if (!isDragging) {
    return null;
  }

  return (
    <>
      {/* Línea izquierda */}
      <div
        style={{
          left: `${leftLinePosition}px`,
          top: `${rulerHeight}px`,
          bottom: 0,
          position: 'fixed',
          width: '1px',
          background: '#d0d0d0',
          opacity: 0.5,
          zIndex: 10,
          pointerEvents: 'none',
          transition: 'none',
        }}
      />
      
      {/* Línea derecha */}
      <div
        style={{
          left: `${rightLinePosition}px`,
          top: `${rulerHeight}px`,
          bottom: 0,
          position: 'fixed',
          width: '1px',
          background: '#d0d0d0',
          opacity: 0.5,
          zIndex: 10,
          pointerEvents: 'none',
          transition: 'none',
        }}
      />
    </>
  );
};
