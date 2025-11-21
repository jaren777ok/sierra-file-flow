import React, { useState, useCallback, useRef, useEffect } from 'react';

interface DocumentRulerProps {
  pageWidth: number;
  leftMargin: number;
  rightMargin: number;
  onLeftMarginChange: (margin: number) => void;
  onRightMarginChange: (margin: number) => void;
}

export const DocumentRuler: React.FC<DocumentRulerProps> = ({
  pageWidth,
  leftMargin,
  rightMargin,
  onLeftMarginChange,
  onRightMarginChange,
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
  }, []);

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
  }, []);

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
        backgroundColor: '#f5f5f5',
        minHeight: '80px'
      }}
    >
      {/* Banner de debug temporal */}
      <div style={{
        textAlign: 'center',
        padding: '4px',
        background: 'linear-gradient(90deg, #3DD6C4, #205059)',
        color: 'white',
        fontSize: '11px',
        fontWeight: 'bold',
        borderRadius: '4px 4px 0 0',
        marginBottom: '8px'
      }}>
        📐 REGLA DE MÁRGENES - Arrastra los triángulos verdes ▼
      </div>
      
      <div ref={rulerRef} className="document-ruler" style={{ width: pageWidth }}>
        {/* Escala superior en cm */}
        <div className="ruler-scale">
          {cmScale.map((cm) => (
            <div
              key={cm}
              className="ruler-tick"
              style={{ left: `${cmToPx(cm)}px` }}
            >
              {cm % 5 === 0 && <span className="ruler-number">{cm}</span>}
            </div>
          ))}
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
          <div className="ruler-marker-triangle" />
        </div>

        {/* Marcador derecho (triángulo verde) */}
        <div
          className="ruler-marker ruler-marker-right"
          style={{ left: `${pageWidth - rightMargin}px` }}
          onMouseDown={() => handleMouseDown('right')}
          title={`Margen derecho: ${rightMargin}px (${pxToCm(rightMargin)}cm)`}
        >
          <div className="ruler-marker-triangle" />
        </div>
      </div>

      {/* Información de márgenes */}
      <div className="ruler-info" style={{ width: pageWidth }}>
        <span className="ruler-info-item">
          Izq: <strong>{leftMargin}px</strong> ({pxToCm(leftMargin)}cm)
        </span>
        <span className="ruler-info-item">
          Área editable: <strong>{effectiveWidth}px</strong> ({pxToCm(effectiveWidth)}cm)
        </span>
        <span className="ruler-info-item">
          Der: <strong>{rightMargin}px</strong> ({pxToCm(rightMargin)}cm)
        </span>
      </div>
    </div>
  );
};
