import { useState, useCallback, useEffect } from 'react';

interface VerticalRulerProps {
  pageHeight: number;
  topMargin: number;
  bottomMargin: number;
  onTopMarginChange: (margin: number) => void;
  onBottomMarginChange: (margin: number) => void;
  onDraggingChange?: (isDragging: boolean) => void;
  rulerWidth?: number;
  headerHeight?: number;
}

export const VerticalRuler = ({
  pageHeight,
  topMargin,
  bottomMargin,
  onTopMarginChange,
  onBottomMarginChange,
  onDraggingChange,
  rulerWidth = 40,
  headerHeight = 140,
}: VerticalRulerProps) => {
  const [isDraggingTop, setIsDraggingTop] = useState(false);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);

  // Conversion utilities
  const pxToCm = (px: number) => (px / pageHeight) * 29.7;
  const cmToPx = (cm: number) => (cm / 29.7) * pageHeight;

  const handleTopMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingTop(true);
    onDraggingChange?.(true);
  }, [onDraggingChange]);

  const handleBottomMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingBottom(true);
    onDraggingChange?.(true);
  }, [onDraggingChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingTop && !isDraggingBottom) return;

    const rulerRect = document.querySelector('.vertical-ruler')?.getBoundingClientRect();
    if (!rulerRect) return;

    const relativeY = e.clientY - rulerRect.top;
    const clampedY = Math.max(50, Math.min(pageHeight - 50, relativeY));

    if (isDraggingTop) {
      const maxTop = pageHeight - bottomMargin - 100;
      const newTopMargin = Math.min(clampedY, maxTop);
      onTopMarginChange(newTopMargin);
    } else if (isDraggingBottom) {
      const maxBottom = pageHeight - topMargin - 100;
      const newBottomMargin = pageHeight - clampedY;
      const clampedBottom = Math.min(newBottomMargin, maxBottom);
      onBottomMarginChange(clampedBottom);
    }
  }, [isDraggingTop, isDraggingBottom, pageHeight, topMargin, bottomMargin, onTopMarginChange, onBottomMarginChange]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingTop || isDraggingBottom) {
      setIsDraggingTop(false);
      setIsDraggingBottom(false);
      onDraggingChange?.(false);
    }
  }, [isDraggingTop, isDraggingBottom, onDraggingChange]);

  useEffect(() => {
    if (isDraggingTop || isDraggingBottom) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingTop, isDraggingBottom, handleMouseMove, handleMouseUp]);

  // Generate scale numbers (0-28cm, every 1cm)
  const scaleNumbers = Array.from({ length: 29 }, (_, i) => i);

  return (
    <div 
      className="vertical-ruler-container"
      style={{ 
        width: '30px',
        height: `calc(100vh - ${headerHeight}px)`,
        position: 'fixed',
        left: 0,
        top: `${headerHeight}px`,
        zIndex: 40,
        background: '#fafafa',
        borderRight: '1px solid #e0e0e0',
      }}
    >
      <div className="vertical-ruler" style={{ 
        height: pageHeight,
        width: '30px',
        background: '#fafafa',
        borderRight: '1px solid #e0e0e0',
        position: 'relative',
      }}>
        {/* Escala vertical */}
        <div className="vertical-ruler-scale" style={{ width: '15px', borderRight: '1px solid #e0e0e0' }}>
          {scaleNumbers.map((cm) => {
            const y = cmToPx(cm);
            return (
              <div key={cm}>
                {/* Marca de centímetro */}
                <div
                  style={{ 
                    position: 'absolute',
                    top: `${y}px`,
                    right: 0,
                    width: '6px',
                    height: '1px',
                    background: '#999',
                    transform: 'translateY(-50%)',
                  }}
                />
                {/* Número de centímetro */}
                {cm > 0 && (
                  <div
                    style={{ 
                      position: 'absolute',
                      top: `${y}px`,
                      left: '2px',
                      transform: 'translateY(-50%)',
                      fontSize: '8px',
                      fontWeight: '500',
                      color: '#999',
                    }}
                  >
                    {cm}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Marcador de margen superior */}
        <div
          style={{
            position: 'absolute',
            left: '15px',
            top: `${topMargin}px`,
            width: '15px',
            height: '20px',
            cursor: isDraggingTop ? 'grabbing' : 'ns-resize',
            zIndex: 20,
            transform: 'translateY(-10px)',
          }}
          onMouseDown={handleTopMouseDown}
          title={`Margen superior: ${topMargin}px (${pxToCm(topMargin).toFixed(1)}cm)`}
        >
          <div style={{
            width: 0,
            height: 0,
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderLeft: '15px solid hsl(var(--sierra-teal))',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
          }} />
        </div>

        {/* Marcador de margen inferior */}
        <div
          style={{
            position: 'absolute',
            left: '15px',
            top: `${pageHeight - bottomMargin}px`,
            width: '15px',
            height: '20px',
            cursor: isDraggingBottom ? 'grabbing' : 'ns-resize',
            zIndex: 20,
            transform: 'translateY(-10px)',
          }}
          onMouseDown={handleBottomMouseDown}
          title={`Margen inferior: ${bottomMargin}px (${pxToCm(bottomMargin).toFixed(1)}cm)`}
        >
          <div style={{
            width: 0,
            height: 0,
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderLeft: '15px solid hsl(var(--sierra-teal))',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
            transform: 'rotate(180deg)',
          }} />
        </div>
      </div>
    </div>
  );
};
