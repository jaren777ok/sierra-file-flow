import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Type,
} from 'lucide-react';

interface FormatToolbarProps {
  onFormat: {
    setFontFamily: (font: string) => void;
    setFontSize: (size: string) => void;
    setTextColor: (color: string) => void;
    toggleBold: () => void;
    toggleItalic: () => void;
    toggleUnderline: () => void;
    setAlignment: (align: 'left' | 'center' | 'right' | 'justify') => void;
    insertList: (ordered: boolean) => void;
    undo: () => void;
    redo: () => void;
  };
}

const fonts = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Comic Sans MS',
  'Trebuchet MS',
  'Arial Black',
  'Impact',
];

const fontSizes = ['8', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];

export const FormatToolbar: React.FC<FormatToolbarProps> = ({ onFormat }) => {
  const [textColor, setTextColor] = useState('#1a1a1a');

  return (
    <div className="flex items-center gap-2 flex-wrap p-2 border-b bg-background">
      {/* Font Family */}
      <div className="toolbar-group">
        <Select onValueChange={onFormat.setFontFamily} defaultValue="Arial">
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Fuente" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={onFormat.setFontSize} defaultValue="11">
          <SelectTrigger className="w-[70px] h-9">
            <SelectValue placeholder="Tamaño" />
          </SelectTrigger>
          <SelectContent>
            {fontSizes.map((size) => (
              <SelectItem key={size} value={size}>
                {size}pt
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Formatting */}
      <div className="toolbar-group">
        <Button
          variant="ghost"
          size="sm"
          onClick={onFormat.toggleBold}
          title="Negrita (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFormat.toggleItalic}
          title="Cursiva (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFormat.toggleUnderline}
          title="Subrayado (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Color */}
      <div className="toolbar-group flex items-center gap-1">
        <Type className="h-4 w-4 text-muted-foreground" />
        <input
          type="color"
          value={textColor}
          onChange={(e) => {
            setTextColor(e.target.value);
            onFormat.setTextColor(e.target.value);
          }}
          className="w-8 h-8 rounded cursor-pointer border border-border"
          title="Color de texto"
        />
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Alignment */}
      <div className="toolbar-group">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormat.setAlignment('left')}
          title="Alinear a la izquierda"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormat.setAlignment('center')}
          title="Centrar"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormat.setAlignment('right')}
          title="Alinear a la derecha"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormat.setAlignment('justify')}
          title="Justificar"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
      <div className="toolbar-group">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormat.insertList(false)}
          title="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormat.insertList(true)}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Undo/Redo */}
      <div className="toolbar-group">
        <Button
          variant="ghost"
          size="sm"
          onClick={onFormat.undo}
          title="Deshacer (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFormat.redo}
          title="Rehacer (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
