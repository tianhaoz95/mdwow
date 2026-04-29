/** Strip ANSI escape sequences from a string (for plain-text matching). */
const ANSI_ESCAPE_RE = /\x1b\[[0-9;]*m/g;

export function stripAnsi(str: string): string {
  return str.replace(ANSI_ESCAPE_RE, '');
}

/**
 * Inject highlight ANSI codes around every occurrence of `query` in an
 * ANSI-coloured string, without disturbing the existing escape sequences.
 *
 * Uses reverse-video (ANSI 7 / 27) by default so highlights compose with
 * whatever colour the text already has.
 *
 * @param highlightOn  - ANSI code(s) to inject before each match
 * @param highlightOff - ANSI code(s) to inject after each match
 */
export function highlightQuery(
  ansiLine: string,
  query: string,
  highlightOn  = '\x1b[7m',
  highlightOff = '\x1b[27m',
): string {
  if (!query) return ansiLine;

  const plain      = stripAnsi(ansiLine);
  const lowerPlain = plain.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Collect all [start, end) ranges in plain-text coordinates
  const ranges: Array<[number, number]> = [];
  let from = 0;
  for (;;) {
    const idx = lowerPlain.indexOf(lowerQuery, from);
    if (idx === -1) break;
    ranges.push([idx, idx + lowerQuery.length]);
    from = idx + 1;
  }
  if (ranges.length === 0) return ansiLine;

  let result     = '';
  let plainIdx   = 0;
  let rangeIdx   = 0;
  let inHighlight = false;

  for (let i = 0; i < ansiLine.length; ) {
    // Pass ANSI escape sequences through without advancing the plain-text cursor
    if (ansiLine[i] === '\x1b' && ansiLine[i + 1] === '[') {
      let j = i + 2;
      while (j < ansiLine.length && ansiLine[j] !== 'm') j++;
      result += ansiLine.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // Plain-text character — open highlight if we're at a range start
    const range = ranges[rangeIdx];
    if (range && plainIdx === range[0] && !inHighlight) {
      result += highlightOn;
      inHighlight = true;
    }

    result += ansiLine[i];
    i++;
    plainIdx++;

    // Close highlight when we've consumed all characters in this range
    if (inHighlight && range && plainIdx === range[1]) {
      result += highlightOff;
      inHighlight = false;
      rangeIdx++;
    }
  }

  if (inHighlight) result += highlightOff;

  return result;
}
