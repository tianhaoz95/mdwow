import { useState, useCallback } from 'react';
import type { TocEntry } from '../utils/renderer.js';

export type TocState = {
  isOpen: boolean;
  cursorIndex: number;
  activeIndex: number; // heading currently visible at top of viewport
};

export function useToc(entries: TocEntry[], scrollOffset: number) {
  const [isOpen, setIsOpen] = useState(false);
  const [cursorIndex, setCursorIndex] = useState(0);

  // Active heading = last heading whose lineIndex <= scrollOffset
  let activeIndex = 0;
  for (let i = 0; i < entries.length; i++) {
    if ((entries[i]?.lineIndex ?? 0) <= scrollOffset) activeIndex = i;
    else break;
  }

  const toggle = useCallback(() => {
    setIsOpen((open) => {
      if (!open) {
        // Snap cursor to active heading when opening
        setCursorIndex(activeIndex);
      }
      return !open;
    });
  }, [activeIndex]);

  const close = useCallback(() => setIsOpen(false), []);

  const moveCursor = useCallback((delta: number) => {
    setCursorIndex((prev) =>
      Math.max(0, Math.min(prev + delta, entries.length - 1)),
    );
  }, [entries.length]);

  const setCursor = useCallback((index: number) => {
    setCursorIndex(Math.max(0, Math.min(index, entries.length - 1)));
  }, [entries.length]);

  return { isOpen, cursorIndex, activeIndex, toggle, close, moveCursor, setCursor };
}
