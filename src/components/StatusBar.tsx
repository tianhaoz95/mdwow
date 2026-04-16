import React from 'react';
import { Box, Text } from 'ink';
import type { InkTheme } from '../themes.js';

type StatusBarProps = {
  scrollOffset: number;
  totalLines: number;
  visibleLines: number;
  readingWidth: number | null;
  tocOpen: boolean;
  hoveredLink: string | null;
  themeMode: 'dark' | 'light';
  inkTheme: InkTheme;
};

type HintProps = {
  keys: string;
  label: string;
  t: InkTheme;
};

function Hint({ keys, label, t }: HintProps) {
  return (
    <Box gap={0}>
      <Text {...t.statusKey}>{keys}</Text>
      <Text {...t.statusBar}>{` ${label}`}</Text>
    </Box>
  );
}

function truncateUrl(url: string, maxLen: number): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 1) + '…';
}

export function StatusBar({
  scrollOffset,
  totalLines,
  visibleLines,
  readingWidth,
  tocOpen,
  hoveredLink,
  themeMode,
  inkTheme: t,
}: StatusBarProps) {
  const currentLine = Math.min(scrollOffset + 1, totalLines);
  const scrollPercent =
    totalLines <= visibleLines
      ? 100
      : Math.round((scrollOffset / Math.max(1, totalLines - visibleLines)) * 100);

  const themeLabel = themeMode === 'dark' ? '◑ dark' : '◐ light';

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={t.borderColor}>
      {/* Link URL row */}
      <Box paddingX={1}>
        {hoveredLink ? (
          <>
            <Text color="cyanBright">{'🔗 '}</Text>
            <Text color={t.link.color} underline>{truncateUrl(hoveredLink, 80)}</Text>
          </>
        ) : (
          <Text>{' '}</Text>
        )}
      </Box>

      {/* Hint row */}
      <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
        <Box gap={2}>
          <Hint keys="↑↓/jk" label="scroll" t={t} />
          <Hint keys="u/d"    label="page"   t={t} />
          <Hint keys="g/G"    label="top/bottom" t={t} />
          <Hint keys="+/-"    label="width"  t={t} />
          <Hint keys="b"      label={tocOpen ? 'close toc' : 'toc'} t={t} />
          <Hint keys="t"      label={themeLabel} t={t} />
          <Hint keys="q"      label="quit"   t={t} />
        </Box>
        <Box gap={2}>
          {readingWidth !== null && (
            <Text {...t.statusKey}>{`width ${readingWidth}`}</Text>
          )}
          <Text {...t.scrollInfo}>
            {`${currentLine}/${totalLines} (${scrollPercent}%)`}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
