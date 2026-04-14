import { useState, useCallback } from 'react';

export type FloatingPreviewState = {
  isOpen: boolean;
  filePath: string | null;
  scrollOffset: number;
};

export function useFloatingPreview() {
  const [state, setState] = useState<FloatingPreviewState>({
    isOpen: false,
    filePath: null,
    scrollOffset: 0,
  });

  const open = useCallback((filePath: string) => {
    setState({ isOpen: true, filePath, scrollOffset: 0 });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, filePath: null, scrollOffset: 0 });
  }, []);

  const scrollBy = useCallback((delta: number, maxScroll: number) => {
    setState((prev) => ({
      ...prev,
      scrollOffset: Math.max(0, Math.min(prev.scrollOffset + delta, maxScroll)),
    }));
  }, []);

  return { ...state, open, close, scrollBy };
}
