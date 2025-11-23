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

  useEffect(() => {
    console.log('📏 MarginGuides positions:', {
      windowWidth,
      pageWidth,
      centerOffset,
      leftMargin,
      rightMargin,
      leftLine: leftLinePosition,
      rightLine: rightLinePosition,
      isDragging,
    });
  }, [windowWidth, pageWidth, centerOffset, leftMargin, rightMargin, leftLinePosition, rightLinePosition, isDragging]);

  // Validar que las posiciones sean correctas
  if (leftLinePosition < 0 || rightLinePosition < 0 || leftLinePosition >= rightLinePosition) {
    console.warn('⚠️ MarginGuides: Posiciones inválidas, no renderizando líneas');
    return null;
  }

  return (
    <>
      {/* Línea izquierda */}
      <div
        className={`margin-guide left ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${leftLinePosition}px`,
          top: `${rulerHeight}px`,
          bottom: 0,
          position: 'fixed',
          width: '2px',
          background: isDragging ? 'hsl(var(--sierra-teal))' : '#888888',
          opacity: isDragging ? 0.9 : 0.7,
          zIndex: 35,
          pointerEvents: 'none',
          boxShadow: isDragging ? '0 0 4px rgba(32, 80, 89, 0.5)' : 'none',
          transition: 'all 0.15s ease',
        }}
      />
      
      {/* Línea derecha */}
      <div
        className={`margin-guide right ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${rightLinePosition}px`,
          top: `${rulerHeight}px`,
          bottom: 0,
          position: 'fixed',
          width: '2px',
          background: isDragging ? 'hsl(var(--sierra-teal))' : '#888888',
          opacity: isDragging ? 0.9 : 0.7,
          zIndex: 35,
          pointerEvents: 'none',
          boxShadow: isDragging ? '0 0 4px rgba(32, 80, 89, 0.5)' : 'none',
          transition: 'all 0.15s ease',
        }}
      />
    </>
  );
};
