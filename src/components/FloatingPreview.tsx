import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { readFileSync, existsSync } from 'fs';
import { basename } from 'path';
import { parseMarkdown } from '../utils/parser.js';
import { renderToLines } from '../utils/renderer.js';

type FloatingPreviewProps = {
  filePath: string;
  terminalWidth: number;
  terminalHeight: number;
  scrollOffset: number;
};

const FLOAT_W_FRACTION = 0.72;
const FLOAT_H_FRACTION = 0.75;

// Strip ANSI codes to measure visible length
function visLen(s: string) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}

// Pad a line with spaces to fill exactly `width` visible columns,
// so the floating box paints over background content behind it.
function padLine(line: string, width: number): string {
  const len = visLen(line);
  return len < width ? line + ' '.repeat(width - len) : line;
}

export function FloatingPreview({
  filePath,
  terminalWidth,
  terminalHeight,
  scrollOffset,
}: FloatingPreviewProps) {
  const floatWidth  = Math.max(40, Math.floor(terminalWidth  * FLOAT_W_FRACTION));
  const floatHeight = Math.max(10, Math.floor(terminalHeight * FLOAT_H_FRACTION));

  // Inner content width (inside the double border)
  const innerWidth  = floatWidth - 2;
  // Rows available for content: floatHeight - border(2) - title(1) - sep(1) - sep(1) - hint(1)
  const contentRows = Math.max(1, floatHeight - 6);

  const { lines, error } = useMemo(() => {
    if (!existsSync(filePath)) {
      return { lines: [] as string[], error: `File not found: ${filePath}` };
    }
    try {
      const content = readFileSync(filePath, 'utf-8');
      const ast = parseMarkdown(content);
      return { lines: renderToLines(ast, innerWidth), error: null };
    } catch (e) {
      return { lines: [] as string[], error: String(e) };
    }
  }, [filePath, innerWidth]);

  const maxScroll    = Math.max(0, lines.length - contentRows);
  const clampedScroll = Math.min(scrollOffset, maxScroll);
  const visibleLines  = lines.slice(clampedScroll, clampedScroll + contentRows);

  // Pad visible lines to innerWidth so they paint over background content
  const paddedLines = visibleLines.map(l => padLine(l || ' ', innerWidth));
  // Fill remaining rows with blank lines if content is shorter than contentRows
  while (paddedLines.length < contentRows) {
    paddedLines.push(' '.repeat(innerWidth));
  }

  // Center the window
  const marginLeft = Math.max(0, Math.floor((terminalWidth  - floatWidth)  / 2));
  const marginTop  = Math.max(0, Math.floor((terminalHeight - floatHeight) / 2) - 1);

  const filename = basename(filePath);
  const scrollPct = lines.length <= contentRows
    ? 100
    : Math.round((clampedScroll / Math.max(1, lines.length - contentRows)) * 100);

  return (
    <Box
      flexDirection="column"
      position="absolute"
      marginLeft={marginLeft}
      marginTop={marginTop}
      width={floatWidth}
      height={floatHeight}
      borderStyle="double"
      borderColor="cyanBright"
    >
      {/* Title bar — padded to fill width */}
      <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
        <Text bold color="cyanBright">{filename}</Text>
        <Text dimColor>{`${clampedScroll + 1}/${lines.length} (${scrollPct}%)`}</Text>
      </Box>
      <Text color="cyanBright" dimColor>{'─'.repeat(innerWidth)}</Text>

      {/* Content — each line padded to innerWidth to erase background */}
      {error ? (
        <Box flexDirection="column" flexGrow={1}>
          <Text color="redBright">{padLine(error, innerWidth)}</Text>
          {Array.from({ length: contentRows - 1 }, (_, i) => (
            <Text key={i}>{' '.repeat(innerWidth)}</Text>
          ))}
        </Box>
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          {paddedLines.map((line, i) => (
            <Text key={clampedScroll + i} wrap="truncate-end">{line}</Text>
          ))}
        </Box>
      )}

      {/* Footer */}
      <Text color="cyanBright" dimColor>{'─'.repeat(innerWidth)}</Text>
      <Box paddingX={1}>
        <Text dimColor>{'↑↓/jk scroll  ·  u/d page  ·  Esc/q close'}</Text>
      </Box>
    </Box>
  );
}

export { FLOAT_W_FRACTION, FLOAT_H_FRACTION };
