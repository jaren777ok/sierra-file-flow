import { useEffect, useCallback, useRef } from 'react';

interface UsePageOverflowProps {
  pages: string[];
  onPagesChange: (pages: string[]) => void;
  maxHeight: number; // Maximum content height in pixels
}

export const usePageOverflow = ({
  pages,
  onPagesChange,
  maxHeight = 1150, // 2000px - 700px (top) - 150px (bottom)
}: UsePageOverflowProps) => {
  const pageRefs = useRef<Map<number, HTMLElement>>(new Map());

  const registerPageRef = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      pageRefs.current.set(index, element);
    } else {
      pageRefs.current.delete(index);
    }
  }, []);

  const checkOverflow = useCallback(() => {
    const newPages: string[] = [...pages];
    let hasChanges = false;

    pageRefs.current.forEach((element, index) => {
      const contentHeight = element.scrollHeight;
      const maxContentHeight = maxHeight;

      // If content exceeds max height, split it
      if (contentHeight > maxContentHeight && element.children.length > 0) {
        const children = Array.from(element.children);
        let accumulatedHeight = 0;
        let splitIndex = -1;

        // Find where to split
        for (let i = 0; i < children.length; i++) {
          const child = children[i] as HTMLElement;
          accumulatedHeight += child.offsetHeight;

          if (accumulatedHeight > maxContentHeight) {
            splitIndex = i;
            break;
          }
        }

        if (splitIndex > 0) {
          // Split content
          const remainingContent = Array.from(children.slice(splitIndex))
            .map(child => child.outerHTML)
            .join('');

          const currentContent = Array.from(children.slice(0, splitIndex))
            .map(child => child.outerHTML)
            .join('');

          newPages[index] = currentContent;
          
          // Add overflow to next page or create new page
          if (index + 1 < newPages.length) {
            newPages[index + 1] = remainingContent + newPages[index + 1];
          } else {
            newPages.push(remainingContent);
          }

          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      onPagesChange(newPages);
    }
  }, [pages, maxHeight, onPagesChange]);

  useEffect(() => {
    // Check overflow on content changes
    const timeoutId = setTimeout(checkOverflow, 500);
    return () => clearTimeout(timeoutId);
  }, [checkOverflow]);

  return { registerPageRef };
};
