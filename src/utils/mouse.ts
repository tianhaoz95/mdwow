export type MouseEvent = {
  type: 'scroll_up' | 'scroll_down' | 'press' | 'release' | 'move';
  button: number;
  x: number;
  y: number;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
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

  // Modifier bits in button byte
  const shift = !!(button & 4);
  const alt   = !!(button & 8);
  const ctrl  = !!(button & 16);
  // Motion bit: bit 5 (32) means mouse-move event
  const isMotion = !!(button & 32);

  if (action === 'm') {
    return { type: 'release', button, x, y, ctrl, shift, alt };
  }

  // Scroll wheel: base button 64/65 (bit 6 set)
  if ((button & ~(4 | 8 | 16)) === 64) return { type: 'scroll_up',   button, x, y, ctrl, shift, alt };
  if ((button & ~(4 | 8 | 16)) === 65) return { type: 'scroll_down', button, x, y, ctrl, shift, alt };

  // Motion event (no button pressed: base button bits = 3)
  if (isMotion) return { type: 'move', button, x, y, ctrl, shift, alt };

  return { type: 'press', button, x, y, ctrl, shift, alt };
}
