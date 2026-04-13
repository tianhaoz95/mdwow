import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

type StatusBarProps = {
  scrollOffset: number;
  totalLines: number;
  visibleLines: number;
  readingWidth: number | null;
  tocOpen: boolean;
};

type HintProps = {
  keys: string;
  label: string;
};

function Hint({ keys, label }: HintProps) {
  return (
    <Box gap={0}>
      <Text {...theme.statusKey}>{keys}</Text>
      <Text {...theme.statusBar}>{` ${label}`}</Text>
    </Box>
  );
}

export function StatusBar({ scrollOffset, totalLines, visibleLines, readingWidth, tocOpen }: StatusBarProps) {
  const currentLine = Math.min(scrollOffset + 1, totalLines);
  const scrollPercent =
    totalLines <= visibleLines
      ? 100
      : Math.round((scrollOffset / Math.max(1, totalLines - visibleLines)) * 100);

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      borderStyle="single"
      borderColor="blue"
    >
      <Box gap={2}>
        <Hint keys="↑↓/jk" label="scroll" />
        <Hint keys="u/d" label="page" />
        <Hint keys="g/G" label="top/bottom" />
        <Hint keys="+/-" label="width" />
        <Hint keys="b" label={tocOpen ? 'close toc' : 'toc'} />
        <Hint keys="q" label="quit" />
      </Box>
      <Box gap={2}>
        {readingWidth !== null && (
          <Text {...theme.statusKey}>{`width ${readingWidth}`}</Text>
        )}
        <Text {...theme.scrollInfo}>
          {`${currentLine}/${totalLines} (${scrollPercent}%)`}
        </Text>
      </Box>
    </Box>
  );
}
