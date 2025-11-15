import { useCallback } from 'react';

export const useContentEditable = (
  onContentChange: (index: number, newContent: string) => void
) => {
  
  const applyFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
  }, []);

  const handleContentChange = useCallback((index: number, html: string) => {
    onContentChange(index, html);
  }, [onContentChange]);

  const insertText = useCallback((text: string) => {
    document.execCommand('insertText', false, text);
  }, []);

  const setFontFamily = useCallback((fontFamily: string) => {
    applyFormat('fontName', fontFamily);
  }, [applyFormat]);

  const setFontSize = useCallback((size: string) => {
    applyFormat('fontSize', size);
  }, [applyFormat]);

  const setTextColor = useCallback((color: string) => {
    applyFormat('foreColor', color);
  }, [applyFormat]);

  const setBackgroundColor = useCallback((color: string) => {
    applyFormat('backColor', color);
  }, [applyFormat]);

  const toggleBold = useCallback(() => {
    applyFormat('bold');
  }, [applyFormat]);

  const toggleItalic = useCallback(() => {
    applyFormat('italic');
  }, [applyFormat]);

  const toggleUnderline = useCallback(() => {
    applyFormat('underline');
  }, [applyFormat]);

  const setAlignment = useCallback((alignment: 'left' | 'center' | 'right' | 'justify') => {
    const commands = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull'
    };
    applyFormat(commands[alignment]);
  }, [applyFormat]);

  const insertList = useCallback((ordered: boolean) => {
    applyFormat(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  }, [applyFormat]);

  const undo = useCallback(() => {
    applyFormat('undo');
  }, [applyFormat]);

  const redo = useCallback(() => {
    applyFormat('redo');
  }, [applyFormat]);

  return {
    handleContentChange,
    insertText,
    setFontFamily,
    setFontSize,
    setTextColor,
    setBackgroundColor,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    setAlignment,
    insertList,
    undo,
    redo,
  };
};
