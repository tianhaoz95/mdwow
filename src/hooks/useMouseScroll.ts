import { useEffect } from 'react';
import { useStdin, useStdout } from 'ink';

// SGR mouse reporting escape sequences
// ?1000h = basic press/release, ?1002h = button-event tracking,
// ?1003h = any-event tracking (hover/move), ?1006h = SGR extended coords
const MOUSE_ON  = '\x1b[?1000h\x1b[?1002h\x1b[?1003h\x1b[?1006h';
const MOUSE_OFF = '\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l';

/**
 * Enables SGR mouse reporting on mount and disables it on unmount.
 * Scroll event parsing is handled in useInput (app.tsx) since Ink passes
 * mouse sequences through its input pipeline as stripped strings like
 * "[<64;x;yM" (ESC already consumed by Ink's escape sequence parser).
 */
export function useMouseScroll(): void {
  const { stdin, isRawModeSupported } = useStdin();
  const { stdout } = useStdout();

  useEffect(() => {
    if (!isRawModeSupported || !stdin || !stdout) return;

    stdout.write(MOUSE_ON);

    return () => {
      stdout.write(MOUSE_OFF);
    };
  }, [stdin, stdout, isRawModeSupported]);
}
