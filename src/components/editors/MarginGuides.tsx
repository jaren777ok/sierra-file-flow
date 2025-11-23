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
  const centerOffset = (windowWidth - pageWidth) / 2;
  const leftLinePosition = centerOffset + leftMargin;
  const rightLinePosition = centerOffset + pageWidth - rightMargin;

  useEffect(() => {
    console.log('📏 MarginGuides positions:', {
      windowWidth,
      centerOffset,
      leftLine: leftLinePosition,
      rightLine: rightLinePosition,
      isDragging,
    });
  }, [windowWidth, centerOffset, leftLinePosition, rightLinePosition, isDragging]);

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
          width: isDragging ? '2px' : '1px',
          zIndex: 35,
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
          width: isDragging ? '2px' : '1px',
          zIndex: 35,
        }}
      />
    </>
  );
};
