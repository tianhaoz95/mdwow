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

type AppProps = {
  filePath: string;
};

export function App({ filePath }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  const terminalWidth = stdout?.columns ?? 80;
  const terminalHeight = stdout?.rows ?? 24;

  // Reserve 3 rows for header (border + content + border) and 3 for status bar
  const visibleLines = Math.max(1, terminalHeight - 6);

  const { content, error, lastUpdated, isWatching } = useFileWatcher(filePath);

  // Parse AST once per content change
  const ast = useMemo(() => {
    if (!content) return null;
    try { return parseMarkdown(content); } catch { return null; }
  }, [content]);

  // Render to plain ANSI lines once per AST/width change
  const lines = useMemo(() => {
    if (!ast) return [];
    return renderToLines(ast, terminalWidth);
  }, [ast, terminalWidth]);

  const totalLines = lines.length;
  const maxScroll = Math.max(0, totalLines - visibleLines);

  const [scrollOffset, setScrollOffset] = useState(0);

  // Clamp scroll when content changes (e.g. file reloaded with fewer lines)
  useEffect(() => {
    setScrollOffset((prev) => Math.min(prev, Math.max(0, totalLines - visibleLines)));
  }, [totalLines, visibleLines]);

  const clamp = useCallback(
    (v: number) => Math.max(0, Math.min(v, maxScroll)),
    [maxScroll],
  );

  const scrollBy = useCallback(
    (delta: number) => setScrollOffset((prev) => clamp(prev + delta)),
    [clamp],
  );

  useMouseScroll(scrollBy);

  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
      return;
    }

    const pageSize = Math.max(1, visibleLines - 2);
    setScrollOffset((prev) => {
      if (key.upArrow || input === 'k') return clamp(prev - 1);
      if (key.downArrow || input === 'j') return clamp(prev + 1);
      if (key.pageUp || input === 'u') return clamp(prev - pageSize);
      if (key.pageDown || input === 'd') return clamp(prev + pageSize);
      if (input === 'g') return 0;
      if (input === 'G') return clamp(maxScroll);
      return prev;
    });
  });

  // Slice only the visible window — O(1) scroll, no re-render of content
  const visibleContent = lines.slice(scrollOffset, scrollOffset + visibleLines);

  const filename = basename(filePath);

  return (
    <Box flexDirection="column" height={terminalHeight}>
      <Header filename={filename} isLive={isWatching} lastUpdated={lastUpdated} />

      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {error ? (
          <ErrorView message={error} />
        ) : !ast ? (
          <Box padding={2}><Text dimColor>Loading...</Text></Box>
        ) : (
          <Box flexDirection="column">
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
      />
    </Box>
  );
}
