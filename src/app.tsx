import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { basename } from 'path';
import { Header } from './components/Header.js';
import { StatusBar } from './components/StatusBar.js';
import { ErrorView } from './components/ErrorView.js';
import { useFileWatcher } from './hooks/useFileWatcher.js';
import { useMouseScroll } from './hooks/useMouseScroll.js';
import { parseMarkdown } from './utils/parser.js';
import { renderToLines } from './utils/renderer.js';
import { parseSgrMouse } from './utils/mouse.js';

type AppProps = {
  filePath: string;
};

// Reading width step per keypress (columns)
const WIDTH_STEP = 10;

export function App({ filePath }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  const terminalWidth = stdout?.columns ?? 80;
  const terminalHeight = stdout?.rows ?? 24;

  // Reserve 3 rows for header (border + content + border) and 3 for status bar
  const visibleLines = Math.max(1, terminalHeight - 6);

  const { content, error, lastUpdated, isWatching } = useFileWatcher(filePath);

  // Reading width: null = full pane width. + narrows it (focus), - widens it.
  // Clamped between 40 and terminalWidth.
  const [readingWidth, setReadingWidth] = useState<number | null>(null);
  const effectiveWidth = readingWidth ?? terminalWidth;
  const clampedWidth = Math.min(Math.max(40, effectiveWidth), terminalWidth);

  // Center the content column within the pane
  const leftMargin = Math.floor((terminalWidth - clampedWidth) / 2);

  // Parse AST once per content change
  const ast = useMemo(() => {
    if (!content) return null;
    try { return parseMarkdown(content); } catch { return null; }
  }, [content]);

  // Render to ANSI lines at the current reading width
  const lines = useMemo(() => {
    if (!ast) return [];
    return renderToLines(ast, clampedWidth);
  }, [ast, clampedWidth]);

  const totalLines = lines.length;
  const maxScroll = Math.max(0, totalLines - visibleLines);

  const [scrollOffset, setScrollOffset] = useState(0);

  // Clamp scroll when content or width changes
  useEffect(() => {
    setScrollOffset((prev) => Math.min(prev, Math.max(0, totalLines - visibleLines)));
  }, [totalLines, visibleLines]);

  const clamp = useCallback(
    (v: number) => Math.max(0, Math.min(v, maxScroll)),
    [maxScroll],
  );

  useMouseScroll();

  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
      return;
    }

    // Mouse scroll
    if (input.startsWith('[<')) {
      const mouse = parseSgrMouse(Buffer.from(input));
      if (mouse?.type === 'scroll_up')   setScrollOffset((prev) => clamp(prev - 3));
      if (mouse?.type === 'scroll_down') setScrollOffset((prev) => clamp(prev + 3));
      return;
    }

    // Reading width: + widens, - narrows, 0 resets to full pane width
    if (input === '+' || input === '=') {
      setReadingWidth((w) => {
        const next = (w ?? terminalWidth) + WIDTH_STEP;
        return next >= terminalWidth ? null : next;
      });
      return;
    }
    if (input === '-' || input === '_') {
      setReadingWidth((w) => Math.max(40, (w ?? terminalWidth) - WIDTH_STEP));
      return;
    }
    if (input === '0') {
      setReadingWidth(null);
      return;
    }

    const pageSize = Math.max(1, visibleLines - 2);
    setScrollOffset((prev) => {
      if (key.upArrow || input === 'k') return clamp(prev - 1);
      if (key.downArrow || input === 'j') return clamp(prev + 1);
      if (key.pageUp || input === 'u')   return clamp(prev - pageSize);
      if (key.pageDown || input === 'd') return clamp(prev + pageSize);
      if (input === 'g') return 0;
      if (input === 'G') return clamp(maxScroll);
      return prev;
    });
  });

  const visibleContent = lines.slice(scrollOffset, scrollOffset + visibleLines);
  const filename = basename(filePath);
  const isNarrowed = readingWidth !== null;

  return (
    <Box flexDirection="column" height={terminalHeight}>
      <Header filename={filename} isLive={isWatching} lastUpdated={lastUpdated} />

      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {error ? (
          <ErrorView message={error} />
        ) : !ast ? (
          <Box padding={2}><Text dimColor>Loading...</Text></Box>
        ) : (
          <Box flexDirection="column" marginLeft={leftMargin} width={clampedWidth}>
            {visibleContent.map((line, i) => (
              <Text key={scrollOffset + i} wrap="truncate-end">{line || ' '}</Text>
            ))}
          </Box>
        )}
      </Box>

      <StatusBar
        scrollOffset={scrollOffset}
        totalLines={totalLines}
        visibleLines={visibleLines}
        readingWidth={isNarrowed ? clampedWidth : null}
      />
    </Box>
  );
}
