import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { basename } from 'path';
import { Header } from './components/Header.js';
import { StatusBar } from './components/StatusBar.js';
import { Sidebar, SIDEBAR_WIDTH } from './components/Sidebar.js';
import { ErrorView } from './components/ErrorView.js';
import { useFileWatcher } from './hooks/useFileWatcher.js';
import { useMouseScroll } from './hooks/useMouseScroll.js';
import { useToc } from './hooks/useToc.js';
import { parseMarkdown } from './utils/parser.js';
import { renderToLinesWithLinks, buildToc } from './utils/renderer.js';
import { parseSgrMouse } from './utils/mouse.js';
import type { LinkSpan } from './utils/renderer.js';

type AppProps = {
  filePath: string;
};

const WIDTH_STEP = 10;

export function App({ filePath }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  const terminalWidth = stdout?.columns ?? 80;
  const terminalHeight = stdout?.rows ?? 24;
  // Header: 3 rows. Status bar: 3 rows normally, 4 when link tooltip is showing.
  // We always reserve 4 for status to avoid layout jump on hover.
  const visibleLines = Math.max(1, terminalHeight - 7);

  const { content, error, lastUpdated, isWatching } = useFileWatcher(filePath);

  const [readingWidth, setReadingWidth] = useState<number | null>(null);

  // Parse AST once per content change
  const ast = useMemo(() => {
    if (!content) return null;
    try { return parseMarkdown(content); } catch { return null; }
  }, [content]);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // TOC entries — recomputed when AST or width changes (width affects line counts)
  // We use terminalWidth here because buildToc needs to match renderToLines widths
  const tocEntries = useMemo(() => {
    if (!ast) return [];
    // Use the content width that renderToLines will use (before sidebar adjustment)
    const w = Math.min(Math.max(40, readingWidth ?? terminalWidth), terminalWidth);
    return buildToc(ast, w);
  }, [ast, readingWidth, terminalWidth]);

  const toc = useToc(tocEntries, scrollOffset);

  // When sidebar is open, shrink content area to make room
  const sidebarOpen = toc.isOpen;
  const contentAreaWidth = sidebarOpen
    ? Math.max(40, terminalWidth - SIDEBAR_WIDTH - 1)
    : terminalWidth;

  const effectiveWidth = readingWidth ?? contentAreaWidth;
  const clampedWidth = Math.min(Math.max(40, effectiveWidth), contentAreaWidth);
  const leftMargin = sidebarOpen ? 0 : Math.floor((terminalWidth - clampedWidth) / 2);

  // Render lines at the effective content width
  const { lines, links } = useMemo(() => {
    if (!ast) return { lines: [] as string[], links: [] as LinkSpan[] };
    return renderToLinesWithLinks(ast, clampedWidth);
  }, [ast, clampedWidth]);

  const totalLines = lines.length;
  const maxScroll = Math.max(0, totalLines - visibleLines);

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

    // Mouse events
    if (input.startsWith('[<')) {
      const mouse = parseSgrMouse(Buffer.from(input));
      if (mouse?.type === 'scroll_up')   setScrollOffset((prev) => clamp(prev - 3));
      if (mouse?.type === 'scroll_down') setScrollOffset((prev) => clamp(prev + 3));

      // Resolve mouse position to a link span
      const resolveLinkAtMouse = () => {
        if (sidebarOpen) return null;
        const lineIndex = scrollOffset + (mouse!.y - 4);
        const col = mouse!.x - 1 - leftMargin;
        return links.find(
          (l) => l.lineIndex === lineIndex && col >= l.colStart && col < l.colEnd,
        ) ?? null;
      };

      // Hover: show URL when over a link, but don't clear when moving away
      if (mouse?.type === 'move') {
        const hit = resolveLinkAtMouse();
        if (hit) setHoveredLink(hit.url);
        return;
      }

      // Click: if on a link, pin the URL in the status bar so the terminal
      // can recognise it (e.g. iTerm2 Cmd+click). Click anywhere else clears it.
      if (mouse?.type === 'press' && !sidebarOpen) {
        const hit = resolveLinkAtMouse();
        setHoveredLink(hit?.url ?? null);
      }

      // Click in sidebar
      if (mouse?.type === 'press' && sidebarOpen && mouse.x <= SIDEBAR_WIDTH) {
        // Terminal row layout (1-indexed):
        //   rows 1-3  : header (border-top + content + border-bottom)
        //   row  4    : sidebar border-top
        //   row  5    : "Contents" title
        //   row  6    : ─ separator
        //   row  7+   : entry rows
        // So: entryRow (0-indexed within visible entries) = mouse.y - 7
        //
        // Must mirror Sidebar.tsx: visibleRows = height - 6
        const sidebarVisibleRows = Math.max(1, visibleLines - 6);
        const scrollStart = Math.max(
          0,
          Math.min(
            toc.cursorIndex - Math.floor(sidebarVisibleRows / 2),
            tocEntries.length - sidebarVisibleRows,
          ),
        );
        const entryRow = mouse.y - 7;
        const clickedEntryIndex = scrollStart + entryRow;
        if (clickedEntryIndex >= 0 && clickedEntryIndex < tocEntries.length) {
          toc.setCursor(clickedEntryIndex);
          const entry = tocEntries[clickedEntryIndex];
          if (entry) setScrollOffset(clamp(entry.lineIndex));
        }
      }
      return;
    }

    // Sidebar-specific keys when open
    if (sidebarOpen) {
      if (key.escape || input === 'b') { toc.close(); return; }
      if (key.upArrow || input === 'k') { toc.moveCursor(-1); return; }
      if (key.downArrow || input === 'j') { toc.moveCursor(1); return; }
      if (key.return) {
        const entry = tocEntries[toc.cursorIndex];
        if (entry) {
          setScrollOffset(clamp(entry.lineIndex));
          toc.close();
        }
        return;
      }
      return; // swallow all other keys while sidebar is open
    }

    // Toggle sidebar
    if (input === 'b') { toc.toggle(); return; }

    // Reading width
    if (input === '+' || input === '=') {
      setReadingWidth((w) => {
        const next = (w ?? contentAreaWidth) + WIDTH_STEP;
        return next >= contentAreaWidth ? null : next;
      });
      return;
    }
    if (input === '-' || input === '_') {
      setReadingWidth((w) => Math.max(40, (w ?? contentAreaWidth) - WIDTH_STEP));
      return;
    }
    if (input === '0') { setReadingWidth(null); return; }

    // Scroll
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

  const contentBox = error ? (
    <ErrorView message={error} />
  ) : !ast ? (
    <Box padding={2}><Text dimColor>Loading...</Text></Box>
  ) : (
    <Box flexDirection="column" marginLeft={leftMargin} width={clampedWidth}>
      {visibleContent.map((line, i) => (
        <Text key={scrollOffset + i} wrap="truncate-end">{line || ' '}</Text>
      ))}
    </Box>
  );

  return (
    <Box flexDirection="column" height={terminalHeight}>
      <Header filename={filename} isLive={isWatching} lastUpdated={lastUpdated} />

      <Box flexDirection="row" flexGrow={1} overflow="hidden">
        {sidebarOpen && (
          <Sidebar
            entries={tocEntries}
            cursorIndex={toc.cursorIndex}
            activeIndex={toc.activeIndex}
            height={visibleLines}
          />
        )}
        <Box flexDirection="column" flexGrow={1} overflow="hidden">
          {contentBox}
        </Box>
      </Box>

      <StatusBar
        scrollOffset={scrollOffset}
        totalLines={totalLines}
        visibleLines={visibleLines}
        readingWidth={readingWidth !== null ? clampedWidth : null}
        tocOpen={sidebarOpen}
        hoveredLink={hoveredLink}
      />
    </Box>
  );
}
