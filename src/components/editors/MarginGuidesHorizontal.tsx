import { useState, useEffect } from 'react';

interface MarginGuidesHorizontalProps {
  pageHeight: number;
  topMargin: number;
  bottomMargin: number;
  rulerWidth: number;
  headerHeight?: number;
  isDragging?: boolean;
}

export const MarginGuidesHorizontal = ({
  pageHeight,
  topMargin,
  bottomMargin,
  rulerWidth,
  headerHeight = 140,
  isDragging = false,
}: MarginGuidesHorizontalProps) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate center offset to position lines correctly
  const PAGE_WIDTH = 1545;
  const centerOffset = (windowWidth - PAGE_WIDTH) / 2;
  
  // Validate inputs
  if (!headerHeight || headerHeight <= 0) return null;
  if (topMargin < 0 || bottomMargin < 0) return null;

  // Solo mostrar líneas cuando se está arrastrando
  if (!isDragging) return null;

  // Calculate line positions
  const topLinePosition = headerHeight + topMargin;
  const bottomLinePosition = headerHeight + pageHeight - bottomMargin;

  const lineStyle = {
    width: '100vw',
    height: '1px',
    background: '#d0d0d0',
    opacity: 0.5,
    zIndex: 10,
    pointerEvents: 'none' as const,
    transition: 'none',
  };

  return (
    <>
      {/* Top margin line */}
      <div
        style={{
          ...lineStyle,
          position: 'fixed',
          left: 0,
          top: `${topLinePosition}px`,
        }}
      />

      {/* Bottom margin line */}
      <div
        style={{
          ...lineStyle,
          position: 'fixed',
          left: 0,
          top: `${bottomLinePosition}px`,
        }}
      />
    </>
  );
};
