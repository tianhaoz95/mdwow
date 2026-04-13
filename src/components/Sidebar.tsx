import React from 'react';
import { Box, Text } from 'ink';
import type { TocEntry } from '../utils/renderer.js';

const SIDEBAR_WIDTH = 28;

type SidebarProps = {
  entries: TocEntry[];
  cursorIndex: number;
  activeIndex: number;
  height: number;
};

// Indent and prefix per heading depth
function entryPrefix(depth: number): string {
  const indent = '  '.repeat(Math.max(0, depth - 1));
  const bullet = depth === 1 ? '◆' : depth === 2 ? '◇' : '·';
  return indent + bullet + ' ';
}

// Truncate text to fit within available width
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

export function Sidebar({ entries, cursorIndex, activeIndex, height }: SidebarProps) {
  const innerWidth = SIDEBAR_WIDTH - 2; // subtract border chars

  // Inner content rows = height - 2 (border) - 4 (title + sep + footer-sep + hint)
  const visibleRows = Math.max(1, height - 6);
  const scrollStart = Math.max(
    0,
    Math.min(cursorIndex - Math.floor(visibleRows / 2), entries.length - visibleRows),
  );
  const visibleEntries = entries.slice(
    Math.max(0, scrollStart),
    Math.max(0, scrollStart) + visibleRows,
  );

  return (
    <Box
      flexDirection="column"
      width={SIDEBAR_WIDTH}
      height={height}
      borderStyle="single"
      borderColor="blue"
      flexShrink={0}
    >
      {/* Title */}
      <Box paddingX={1}>
        <Text bold color="blueBright">Contents</Text>
      </Box>
      <Text dimColor>{'─'.repeat(innerWidth)}</Text>

      {/* Entries */}
      {visibleEntries.map((entry, vi) => {
        const realIndex = Math.max(0, scrollStart) + vi;
        const isCursor = realIndex === cursorIndex;
        const isActive = realIndex === activeIndex;
        const prefix = entryPrefix(entry.depth);
        const maxText = innerWidth - prefix.length;
        const label = truncate(entry.text, maxText);

        let textColor: string;
        if (isCursor) textColor = 'black';
        else if (isActive) textColor = 'cyanBright';
        else textColor = 'white';

        return (
          <Box key={realIndex} paddingX={0}>
            <Text
              backgroundColor={isCursor ? 'cyanBright' : undefined}
              color={textColor}
              dimColor={!isCursor && !isActive}
              wrap="truncate-end"
            >
              {prefix + label}
            </Text>
          </Box>
        );
      })}

      {/* Scrollbar hint if entries overflow */}
      {entries.length > visibleRows && (
        <Box marginTop="auto">
          <Text dimColor>{`${cursorIndex + 1}/${entries.length}`}</Text>
        </Box>
      )}

      {/* Footer hint */}
      <Text dimColor>{'─'.repeat(innerWidth)}</Text>
      <Box paddingX={0}>
        <Text dimColor>↑↓ move  ↵ jump  b close</Text>
      </Box>
    </Box>
  );
}

export { SIDEBAR_WIDTH };
