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
        width: `${rulerWidth}px`,
        height: `calc(100vh - ${headerHeight}px)`,
        position: 'fixed',
        left: 0,
        top: `${headerHeight}px`,
        zIndex: 45,
      }}
    >
      <div className="vertical-ruler" style={{ width: `${rulerWidth}px`, height: `${pageHeight}px` }}>
        {/* Scale */}
        <div className="vertical-ruler-scale">
          {scaleNumbers.map((cm) => {
            const y = cmToPx(cm);
            return (
              <div key={cm}>
                {/* Tick mark */}
                <div
                  className="vertical-ruler-tick"
                  style={{ top: `${y}px` }}
                />
                {/* Number */}
                {cm > 0 && (
                  <div
                    className="vertical-ruler-number"
                    style={{ top: `${y}px` }}
                  >
                    {cm}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Top margin zone (gray striped) */}
        <div
          className="vertical-ruler-margin-top"
          style={{
            top: 0,
            height: `${topMargin}px`,
          }}
        />

        {/* Editable area (white) */}
        <div
          className="vertical-ruler-editable-area"
          style={{
            top: `${topMargin}px`,
            height: `${pageHeight - topMargin - bottomMargin}px`,
          }}
        />

        {/* Bottom margin zone (gray striped) */}
        <div
          className="vertical-ruler-margin-bottom"
          style={{
            top: `${pageHeight - bottomMargin}px`,
            height: `${bottomMargin}px`,
          }}
        />

        {/* Top margin marker */}
        <div
          className="vertical-ruler-marker"
          style={{
            top: `${topMargin}px`,
            cursor: 'ns-resize',
          }}
          onMouseDown={handleTopMouseDown}
          title={`Margen superior: ${topMargin}px (${pxToCm(topMargin).toFixed(1)}cm)`}
        >
          <div 
            className="vertical-ruler-marker-triangle"
            style={{
              borderLeft: `24px solid ${isDraggingTop ? '#3DD6C4' : 'hsl(var(--sierra-teal))'}`,
            }}
          />
        </div>

        {/* Bottom margin marker */}
        <div
          className="vertical-ruler-marker vertical-ruler-marker-bottom"
          style={{
            top: `${pageHeight - bottomMargin}px`,
            cursor: 'ns-resize',
          }}
          onMouseDown={handleBottomMouseDown}
          title={`Margen inferior: ${bottomMargin}px (${pxToCm(bottomMargin).toFixed(1)}cm)`}
        >
          <div 
            className="vertical-ruler-marker-triangle vertical-ruler-marker-triangle-bottom"
            style={{
              borderLeft: `24px solid ${isDraggingBottom ? '#3DD6C4' : 'hsl(var(--sierra-teal))'}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
