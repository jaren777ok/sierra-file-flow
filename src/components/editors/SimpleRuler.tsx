import { useEffect, useRef, useState } from 'react';

interface SimpleRulerProps {
  leftMargin: number;  // en píxeles
  rightMargin: number; // en píxeles
  onLeftMarginChange: (margin: number) => void;
  onRightMarginChange: (margin: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  pageWidth?: number; // ancho de página en px (default 793px = 21cm)
}

export const SimpleRuler = ({ 
  leftMargin, 
  rightMargin,
  onLeftMarginChange,
  onRightMarginChange,
  onDragStart,
  onDragEnd,
  pageWidth = 793 // 21cm en px aprox
}: SimpleRulerProps) => {
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  
  // Conversión: ~37.8px = 1cm en pantalla a 96 DPI
  const CM_IN_PX = 37.8;
  
  // Generar marcas de 0.5 a 20.5cm
  const marks = Array.from({ length: 21 }, (_, i) => i + 0.5);
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = rulerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      
      if (isDragging === 'left') {
        // Limitar entre 0 y mitad de página (para que no se crucen)
        const newMargin = Math.max(20, Math.min(x, pageWidth / 2 - 20));
        onLeftMarginChange(newMargin);
      } else if (isDragging === 'right') {
        // Triángulo derecho controla margin desde el borde derecho
        const rightEdge = pageWidth - x;
        const newMargin = Math.max(20, Math.min(rightEdge, pageWidth / 2 - 20));
        onRightMarginChange(newMargin);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(null);
      onDragEnd?.();
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, pageWidth, onLeftMarginChange, onRightMarginChange]);
  
  return (
    <div 
      ref={rulerRef}
      className="relative h-[30px] select-none bg-white border-b border-gray-300"
      style={{ width: pageWidth }}
    >
      {/* Fondo de la regla */}
      <div className="absolute inset-0 bg-gray-50" />
      
      {/* Números de centímetros */}
      {marks.map(cm => (
        <div
          key={`num-${cm}`}
          className="absolute top-[2px] text-[10px] font-medium text-gray-600 pointer-events-none"
          style={{ left: cm * CM_IN_PX - 4 }}
        >
          {cm}
        </div>
      ))}
      
      {/* Líneas de la regla */}
      <svg className="absolute top-[14px] w-full h-[16px] pointer-events-none">
        {marks.flatMap(cm => {
          const majorLine = (
            <line
              key={`major-${cm}`}
              x1={cm * CM_IN_PX}
              y1="0"
              x2={cm * CM_IN_PX}
              y2="10"
              stroke="#999"
              strokeWidth="1"
            />
          );
          
          // Mini marcas cada 0.5cm
          const minorLine = cm < 20 ? (
            <line
              key={`minor-${cm}`}
              x1={cm * CM_IN_PX + CM_IN_PX / 2}
              y1="0"
              x2={cm * CM_IN_PX + CM_IN_PX / 2}
              y2="5"
              stroke="#ccc"
              strokeWidth="1"
            />
          ) : null;
          
          return [majorLine, minorLine].filter(Boolean);
        })}
      </svg>
      
      {/* Triángulo IZQUIERDO (margin-left) - sierra-teal color */}
      <div
        className={`absolute top-[16px] cursor-ew-resize transition-transform ${
          isDragging === 'left' ? 'scale-125' : 'hover:scale-110'
        }`}
        style={{ left: leftMargin - 6 }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging('left');
          onDragStart?.();
        }}
      >
        <svg width="12" height="14" viewBox="0 0 12 14">
          <polygon 
            points="6,0 12,14 0,14" 
            fill={isDragging === 'left' ? '#205059' : '#3DD6C4'}
            className="drop-shadow-sm"
          />
        </svg>
      </div>
      
      {/* Triángulo DERECHO (margin-right) - sierra-teal color */}
      <div
        className={`absolute top-[16px] cursor-ew-resize transition-transform ${
          isDragging === 'right' ? 'scale-125' : 'hover:scale-110'
        }`}
        style={{ left: pageWidth - rightMargin - 6 }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging('right');
          onDragStart?.();
        }}
      >
        <svg width="12" height="14" viewBox="0 0 12 14">
          <polygon 
            points="6,0 12,14 0,14" 
            fill={isDragging === 'right' ? '#205059' : '#3DD6C4'}
            className="drop-shadow-sm"
          />
        </svg>
      </div>
      
      {/* Líneas guía durante el arrastre - sierra-teal */}
      {isDragging && (
        <>
          {isDragging === 'left' && (
            <div
              className="absolute top-[30px] w-[2px] bg-sierra-bright opacity-50 pointer-events-none"
              style={{ 
                left: leftMargin,
                height: 'calc(100vh - 138px)'
              }}
            />
          )}
          {isDragging === 'right' && (
            <div
              className="absolute top-[30px] w-[2px] bg-sierra-bright opacity-50 pointer-events-none"
              style={{ 
                left: pageWidth - rightMargin,
                height: 'calc(100vh - 138px)'
              }}
            />
          )}
        </>
      )}
    </div>
  );
};
