import React, { useState, useCallback, useRef, useEffect } from 'react';

interface DocumentRulerProps {
  pageWidth: number;
  leftMargin: number;
  rightMargin: number;
  onLeftMarginChange: (margin: number) => void;
  onRightMarginChange: (margin: number) => void;
  onDraggingChange?: (isDragging: boolean) => void;
}

export const DocumentRuler: React.FC<DocumentRulerProps> = ({
  pageWidth,
  leftMargin,
  rightMargin,
  onLeftMarginChange,
  onRightMarginChange,
  onDraggingChange,
}) => {
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const rulerRef = useRef<HTMLDivElement>(null);

  const effectiveWidth = pageWidth - leftMargin - rightMargin;

  // Debug log para verificar renderizado
  useEffect(() => {
    console.log('🎨 DocumentRuler rendered:', {
      pageWidth,
      leftMargin,
      rightMargin,
      effectiveWidth
    });
  }, [pageWidth, leftMargin, rightMargin, effectiveWidth]);

  // Generar escala en centímetros (0-21cm para A4 portrait)
  const cmScale = Array.from({ length: 22 }, (_, i) => i);
  
  // Convertir px a cm (aproximación: 1545px = 21cm)
  const pxToCm = (px: number) => ((px / pageWidth) * 21).toFixed(1);
  const cmToPx = (cm: number) => (cm / 21) * pageWidth;

  const handleMouseDown = useCallback((side: 'left' | 'right') => {
    if (side === 'left') {
      setIsDraggingLeft(true);
    } else {
      setIsDraggingRight(true);
    }
    onDraggingChange?.(true);
  }, [onDraggingChange]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!rulerRef.current || (!isDraggingLeft && !isDraggingRight)) return;

      const rect = rulerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;

      // Limitar entre 50px y mitad de la página
      const minMargin = 50;
      const maxMargin = pageWidth / 2;

      if (isDraggingLeft) {
        let newLeftMargin = Math.max(minMargin, Math.min(offsetX, maxMargin));
        // No permitir que cruce el marcador derecho
        if (newLeftMargin + rightMargin > pageWidth - minMargin) {
          newLeftMargin = pageWidth - rightMargin - minMargin;
        }
        onLeftMarginChange(Math.round(newLeftMargin));
      } else if (isDraggingRight) {
        const rightPosition = pageWidth - offsetX;
        let newRightMargin = Math.max(minMargin, Math.min(rightPosition, maxMargin));
        // No permitir que cruce el marcador izquierdo
        if (leftMargin + newRightMargin > pageWidth - minMargin) {
          newRightMargin = pageWidth - leftMargin - minMargin;
        }
        onRightMarginChange(Math.round(newRightMargin));
      }
    },
    [isDraggingLeft, isDraggingRight, leftMargin, rightMargin, pageWidth, onLeftMarginChange, onRightMarginChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
    onDraggingChange?.(false);
  }, [onDraggingChange]);

  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingLeft, isDraggingRight, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className="document-ruler-container" 
      style={{ 
        width: pageWidth, 
        margin: '0 auto',
        padding: '0',
        minHeight: '30px',
        background: '#fafafa',
        border: '1px solid #e0e0e0',
      }}
    >
      <div ref={rulerRef} className="document-ruler" style={{ width: pageWidth, height: '30px' }}>
        {/* Escala superior en cm */}
        <div className="ruler-scale">
          {cmScale.map((cm) => {
            const isMajorTick = cm > 0;
            const tickHeight = cm % 5 === 0 ? 12 : 8;
            
            return (
              <React.Fragment key={cm}>
                {/* Tick mark */}
                <div
                  className="ruler-tick"
                  style={{ 
                    left: `${cmToPx(cm)}px`,
                    height: `${tickHeight}px`,
                    width: cm % 5 === 0 ? '2px' : '1px'
                  }}
                />
                
                {/* Número - MOSTRAR TODOS excepto 0 */}
                {isMajorTick && (
                  <span 
                    className="ruler-number"
                    style={{ 
                      left: `${cmToPx(cm)}px`,
                      fontSize: '10px',
                      fontWeight: 500,
                      color: '#666',
                    }}
                  >
                    {cm}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Zona margen izquierdo (gris rayado) */}
        <div
          className="ruler-margin-left"
          style={{
            width: `${leftMargin}px`,
            left: 0,
          }}
        />

        {/* Zona editable (blanca) */}
        <div
          className="ruler-editable-area"
          style={{
            left: `${leftMargin}px`,
            width: `${effectiveWidth}px`,
          }}
        />

        {/* Zona margen derecho (gris rayado) */}
        <div
          className="ruler-margin-right"
          style={{
            width: `${rightMargin}px`,
            right: 0,
          }}
        />

        {/* Marcador izquierdo (triángulo verde) */}
        <div
          className="ruler-marker ruler-marker-left"
          style={{ left: `${leftMargin}px` }}
          onMouseDown={() => handleMouseDown('left')}
          title={`Margen izquierdo: ${leftMargin}px (${pxToCm(leftMargin)}cm)`}
        >
          <div 
            className="ruler-marker-triangle"
            style={{
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: `16px solid ${isDraggingLeft ? '#3DD6C4' : 'hsl(var(--sierra-teal))'}`,
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            }}
          />
        </div>

        {/* Marcador derecho (triángulo verde) */}
        <div
          className="ruler-marker ruler-marker-right"
          style={{ left: `${pageWidth - rightMargin}px` }}
          onMouseDown={() => handleMouseDown('right')}
          title={`Margen derecho: ${rightMargin}px (${pxToCm(rightMargin)}cm)`}
        >
          <div 
            className="ruler-marker-triangle"
            style={{
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: `16px solid ${isDraggingRight ? '#3DD6C4' : 'hsl(var(--sierra-teal))'}`,
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            }}
          />
        </div>
      </div>
    </div>
  );
};
