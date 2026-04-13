import { useEffect } from 'react';
import { useStdin, useStdout } from 'ink';
import { parseSgrMouse } from '../utils/mouse.js';

// SGR mouse reporting escape sequences
const MOUSE_ON = '\x1b[?1000h\x1b[?1002h\x1b[?1006h';
const MOUSE_OFF = '\x1b[?1000l\x1b[?1002l\x1b[?1006l';

const SCROLL_LINES = 3;

/**
 * Enables SGR mouse reporting on mount and listens for scroll wheel events.
 * Calls onScroll with a positive delta for scroll-down and negative for scroll-up.
 * Restores the terminal on unmount.
 */
export function useMouseScroll(onScroll: (delta: number) => void): void {
  const { stdin, isRawModeSupported } = useStdin();
  const { stdout } = useStdout();

  useEffect(() => {
    if (!isRawModeSupported || !stdin || !stdout) return;

    // Enable SGR mouse reporting
    stdout.write(MOUSE_ON);

    const handler = (data: Buffer) => {
      const event = parseSgrMouse(data);
      if (!event) return;
      if (event.type === 'scroll_up') onScroll(-SCROLL_LINES);
      if (event.type === 'scroll_down') onScroll(SCROLL_LINES);
    };

    stdin.on('data', handler);

    return () => {
      stdin.off('data', handler);
      stdout.write(MOUSE_OFF);
    };
  // onScroll is a stable callback from useScrolling — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stdin, stdout, isRawModeSupported]);
}
