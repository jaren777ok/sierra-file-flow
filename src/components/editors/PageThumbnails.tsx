import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface PageThumbnailsProps {
  pages: string[];
  currentPage: number;
  onPageSelect: (index: number) => void;
}

export const PageThumbnails: React.FC<PageThumbnailsProps> = ({
  pages,
  currentPage,
  onPageSelect,
}) => {
  return (
    <div className="w-48 bg-muted/30 border-r flex-shrink-0">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Páginas</h3>
        <p className="text-xs text-muted-foreground">{pages.length} páginas</p>
      </div>
      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-2 space-y-2">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => onPageSelect(index)}
              className={cn(
                "w-full aspect-[210/297] border-2 rounded-lg overflow-hidden transition-all hover:border-sierra-teal hover:shadow-md",
                currentPage === index 
                  ? "border-sierra-teal shadow-lg ring-2 ring-sierra-teal/30" 
                  : "border-border"
              )}
            >
              <div className="w-full h-full bg-white flex items-center justify-center text-xs font-medium text-muted-foreground">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
