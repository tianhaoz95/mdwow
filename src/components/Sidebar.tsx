import React from 'react';
import { Box, Text } from 'ink';
import type { TocEntry } from '../utils/renderer.js';
import type { InkTheme } from '../themes.js';

const SIDEBAR_WIDTH = 28;

type SidebarProps = {
  entries: TocEntry[];
  cursorIndex: number;
  activeIndex: number;
  height: number;
  inkTheme: InkTheme;
};

function entryPrefix(depth: number): string {
  const indent = '  '.repeat(Math.max(0, depth - 1));
  const bullet = depth === 1 ? '◆' : depth === 2 ? '◇' : '·';
  return indent + bullet + ' ';
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

export function Sidebar({ entries, cursorIndex, activeIndex, height, inkTheme: t }: SidebarProps) {
  const innerWidth = SIDEBAR_WIDTH - 2;
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
      borderColor={t.borderColor}
      flexShrink={0}
    >
      <Box paddingX={1}>
        <Text bold color={t.statusKey.color}>Contents</Text>
      </Box>
      <Text dimColor>{'─'.repeat(innerWidth)}</Text>

      {visibleEntries.map((entry, vi) => {
        const realIndex = Math.max(0, scrollStart) + vi;
        const isCursor = realIndex === cursorIndex;
        const isActive = realIndex === activeIndex;
        const prefix = entryPrefix(entry.depth);
        const label = truncate(entry.text, innerWidth - prefix.length);

        const style = isCursor ? t.tocCursor : isActive ? t.tocActive : t.tocNormal;

        return (
          <Box key={realIndex}>
            <Text {...style} wrap="truncate-end">
              {prefix + label}
            </Text>
          </Box>
        );
      })}

      {entries.length > visibleRows && (
        <Box marginTop="auto">
          <Text dimColor>{`${cursorIndex + 1}/${entries.length}`}</Text>
        </Box>
      )}

      <Text dimColor>{'─'.repeat(innerWidth)}</Text>
      <Box paddingX={0}>
        <Text dimColor>↑↓ move  ↵ jump  b close</Text>
      </Box>
    </Box>
  );
}

export { SIDEBAR_WIDTH };
