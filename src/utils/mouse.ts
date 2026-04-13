export type MouseEvent = {
  type: 'scroll_up' | 'scroll_down' | 'press' | 'release';
  button: number;
  x: number;
  y: number;
};

/**
 * Parse an SGR extended mouse escape sequence.
 *
 * Accepts both the full sequence (ESC [ < Cb ; Cx ; Cy M) and the
 * ESC-stripped variant that Ink passes through useInput ([< Cb ; Cx ; Cy M).
 *
 * Button byte meanings relevant to scrolling:
 *   64 = scroll up
 *   65 = scroll down
 *
 * Returns null if the buffer does not contain a valid SGR mouse sequence.
 */
export function parseSgrMouse(data: Buffer): MouseEvent | null {
  const str = data.toString('binary');

  // Accept both ESC[< (full) and [< (Ink-stripped)
  let rest: string | null = null;
  const fullIdx = str.indexOf('\x1b[<');
  if (fullIdx !== -1) {
    rest = str.slice(fullIdx + 3);
  } else if (str.startsWith('[<')) {
    rest = str.slice(2);
  }
  if (rest === null) return null;
  // Match: button;x;y followed by M (press) or m (release)
  const match = rest.match(/^(\d+);(\d+);(\d+)([Mm])/);
  if (!match) return null;

  const button = parseInt(match[1]!, 10);
  const x = parseInt(match[2]!, 10);
  const y = parseInt(match[3]!, 10);
  const action = match[4]!;

  if (action === 'm') {
    return { type: 'release', button, x, y };
  }

  // Scroll wheel: button 64 = up, 65 = down
  if (button === 64) return { type: 'scroll_up', button, x, y };
  if (button === 65) return { type: 'scroll_down', button, x, y };

  return { type: 'press', button, x, y };
}
