import { useState, useCallback, useRef } from 'react';
import { stripAnsi } from '../utils/ansi.js';

export type SelectionPoint = { line: number; col: number };

export type UseTextSelectionReturn = {
  selectionStart:  SelectionPoint | null;
  selectionEnd:    SelectionPoint | null;
  isSelecting:     boolean;
  startSelection:  (line: number, col: number) => void;
  updateSelection: (line: number, col: number) => void;
  endSelection:    (line: number, col: number) => string;
  clearSelection:  () => void;
};

/** Pure function — exported for unit testing. */
export function extractText(
  start: SelectionPoint | null,
  end:   SelectionPoint | null,
  lines: string[],
): string {
  if (!start || !end) return '';

  let topPt = start, bottomPt = end;
  if (
    topPt.line > bottomPt.line ||
    (topPt.line === bottomPt.line && topPt.col > bottomPt.col)
  ) {
    [topPt, bottomPt] = [bottomPt, topPt];
  }

  const firstLine = Math.max(0, topPt.line);
  const lastLine  = Math.min(lines.length - 1, bottomPt.line);
  if (firstLine > lastLine) return '';

  const result: string[] = [];
  for (let li = firstLine; li <= lastLine; li++) {
    const plain = stripAnsi(lines[li] ?? '');
    if (firstLine === lastLine) {
      result.push(plain.slice(
        Math.min(topPt.col, plain.length),
        Math.min(bottomPt.col, plain.length),
      ));
    } else if (li === firstLine) {
      result.push(plain.slice(Math.min(topPt.col, plain.length)));
    } else if (li === lastLine) {
      result.push(plain.slice(0, Math.min(bottomPt.col, plain.length)));
    } else {
      result.push(plain);
    }
  }
  return result.join('\n');
}

export function useTextSelection(lines: string[]): UseTextSelectionReturn {
  const [selectionStart, setSelectionStart] = useState<SelectionPoint | null>(null);
  const [selectionEnd,   setSelectionEnd]   = useState<SelectionPoint | null>(null);
  const [isSelecting,    setIsSelecting]    = useState(false);

  // Refs for synchronous reads inside endSelection callbacks
  const startRef = useRef<SelectionPoint | null>(null);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const startSelection = useCallback((line: number, col: number) => {
    const pt = { line, col };
    startRef.current = pt;
    setSelectionStart(pt);
    setSelectionEnd(pt);
    setIsSelecting(true);
  }, []);

  const updateSelection = useCallback((line: number, col: number) => {
    setSelectionEnd({ line, col });
  }, []);

  const endSelection = useCallback((line: number, col: number): string => {
    setSelectionEnd({ line, col });
    setIsSelecting(false);
    return extractText(startRef.current, { line, col }, linesRef.current);
  }, []);

  const clearSelection = useCallback(() => {
    startRef.current = null;
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
  }, []);

  return {
    selectionStart,
    selectionEnd,
    isSelecting,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
  };
}
