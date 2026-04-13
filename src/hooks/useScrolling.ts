import { useState, useCallback } from 'react';
import type { Key } from 'ink';

export function useScrolling(totalLines: number, visibleLines: number) {
  const [scrollOffset, setScrollOffset] = useState(0);

  const maxScroll = Math.max(0, totalLines - visibleLines);

  const clamp = (val: number) => Math.max(0, Math.min(val, maxScroll));

  const scrollTo = useCallback(
    (offset: number) => setScrollOffset(clamp(offset)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxScroll],
  );

  const handleInput = useCallback(
    (input: string, key: Key) => {
      setScrollOffset((prev) => {
        const pageSize = Math.max(1, visibleLines - 2);

        if (key.upArrow || input === 'k') {
          return clamp(prev - 1);
        }
        if (key.downArrow || input === 'j') {
          return clamp(prev + 1);
        }
        if (key.pageUp || input === 'u') {
          return clamp(prev - pageSize);
        }
        if (key.pageDown || input === 'd') {
          return clamp(prev + pageSize);
        }
        if (input === 'g') {
          return 0;
        }
        if (input === 'G') {
          return clamp(maxScroll);
        }
        return prev;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleLines, maxScroll],
  );

  const scrollBy = useCallback(
    (delta: number) => setScrollOffset((prev) => clamp(prev + delta)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxScroll],
  );

  return { scrollOffset, scrollTo, handleInput, scrollBy };
}
