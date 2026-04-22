import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Box, Text, useApp, useInput, useStdout, useStdin } from 'ink';
import { basename, resolve, dirname, extname, isAbsolute } from 'path';
import { existsSync } from 'fs';
import { Header } from './components/Header.js';
import { StatusBar } from './components/StatusBar.js';
import { Sidebar, SIDEBAR_WIDTH } from './components/Sidebar.js';
import { FloatingPreview } from './components/FloatingPreview.js';
import { ErrorView } from './components/ErrorView.js';
import { useFileWatcher } from './hooks/useFileWatcher.js';
import { useMouseScroll } from './hooks/useMouseScroll.js';
import { useToc } from './hooks/useToc.js';
import { useFloatingPreview } from './hooks/useFloatingPreview.js';
import { parseMarkdown } from './utils/parser.js';
import { renderToLinesWithLinks, buildToc, setRendererTheme } from './utils/renderer.js';
import { parseSgrMouse } from './utils/mouse.js';
import { darkRendererTheme, lightRendererTheme, darkInkTheme, lightInkTheme, type ThemeMode } from './themes.js';
import type { LinkSpan } from './utils/renderer.js';

/** Resolve a link URL to an absolute path if it points to a local .md file. */
function resolveMarkdownLink(url: string, fromFile: string): string | null {
  // Skip http/https/mailto and other non-file URLs
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(url)) return null;
  if (extname(url).toLowerCase() !== '.md') return null;
  const abs = isAbsolute(url) ? url : resolve(dirname(fromFile), url);
  return existsSync(abs) ? abs : null;
}

type AppProps = {
  filePath: string;
};

const WIDTH_STEP = 10;

export function App({ filePath }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { isRawModeSupported } = useStdin();

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
  const preview = useFloatingPreview();
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const inkTheme = themeMode === 'dark' ? darkInkTheme : lightInkTheme;

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

  // Render lines at the effective content width (re-renders when theme changes)
  const { lines, links } = useMemo(() => {
    if (!ast) return { lines: [] as string[], links: [] as LinkSpan[] };
    setRendererTheme(themeMode === 'dark' ? darkRendererTheme : lightRendererTheme);
    return renderToLinesWithLinks(ast, clampedWidth);
  }, [ast, clampedWidth, themeMode]);

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

  // Floating preview visible lines for its own scroll calculations
  const previewContentRows = Math.max(1, Math.floor(terminalHeight * 0.75) - 7);

  const handleInput = useCallback((input: string, key: any) => {
    if (key.ctrl && input === 'c') { exit(); return; }

    // Floating preview captures all keys while open
    if (preview.isOpen) {
      if (key.escape || input === 'q') { preview.close(); return; }
      const pageSize = Math.max(1, previewContentRows - 2);
      if (key.upArrow   || input === 'k') { preview.scrollBy(-1,        9999); return; }
      if (key.downArrow || input === 'j') { preview.scrollBy(+1,        9999); return; }
      if (key.pageUp    || input === 'u') { preview.scrollBy(-pageSize,  9999); return; }
      if (key.pageDown  || input === 'd') { preview.scrollBy(+pageSize,  9999); return; }
      if (input === 'g') { preview.scrollBy(-99999, 9999); return; }
      if (input === 'G') { preview.scrollBy(+99999, 9999); return; }
      if (input.startsWith('[<')) {
        const mouse = parseSgrMouse(Buffer.from(input));
        if (mouse?.type === 'scroll_up')   { preview.scrollBy(-3, 9999); return; }
        if (mouse?.type === 'scroll_down') { preview.scrollBy(+3, 9999); return; }
        // Click outside the floating window → close it
        if (mouse?.type === 'press') {
          const floatWidth  = Math.max(40, Math.floor(terminalWidth  * 0.72));
          const floatHeight = Math.max(10, Math.floor(terminalHeight * 0.75));
          const floatLeft   = Math.max(0, Math.floor((terminalWidth  - floatWidth)  / 2)) + 1; // 1-indexed
          const floatTop    = Math.max(0, Math.floor((terminalHeight - floatHeight) / 2) - 1) + 1;
          const floatRight  = floatLeft + floatWidth  - 1;
          const floatBottom = floatTop  + floatHeight - 1;
          const inside = mouse.x >= floatLeft && mouse.x <= floatRight
                      && mouse.y >= floatTop  && mouse.y <= floatBottom;
          if (!inside) { preview.close(); return; }
        }
      }
      return; // swallow everything else
    }

    if (input === 'q') { exit(); return; }

    // Mouse events
    if (input.startsWith('[<')) {
      const mouse = parseSgrMouse(Buffer.from(input));
      if (mouse?.type === 'scroll_up')   setScrollOffset((prev) => clamp(prev - 3));
      if (mouse?.type === 'scroll_down') setScrollOffset((prev) => clamp(prev + 3));

      // Resolve mouse position to a link span
      const resolveLinkAtMouse = () => {
        if (sidebarOpen) return null;
        const lineIndex = scrollOffset + (mouse!.y - 3);
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

      // Click: handle link clicks
      if (mouse?.type === 'press' && !sidebarOpen) {
        const hit = resolveLinkAtMouse();
        if (hit) {
          const mdPath = resolveMarkdownLink(hit.url, filePath);
          if (mdPath) {
            preview.open(mdPath);
          } else {
            setHoveredLink(hit.url);
          }
        } else {
          setHoveredLink(null);
        }
      }

      // Click in sidebar
      if (mouse?.type === 'press' && sidebarOpen && mouse.x <= SIDEBAR_WIDTH) {
        const sidebarVisibleRows = Math.max(1, visibleLines - 6);
        const scrollStart = Math.max(
          0,
          Math.min(
            toc.cursorIndex - Math.floor(sidebarVisibleRows / 2),
            tocEntries.length - sidebarVisibleRows,
          ),
        );
        const entryRow = mouse.y - 5;
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

    // Toggle theme
    if (input === 't') {
      setThemeMode((m) => m === 'dark' ? 'light' : 'dark');
      return;
    }

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
  }, [exit, preview, scrollOffset, sidebarOpen, toc, tocEntries, links, leftMargin, contentAreaWidth, visibleLines, maxScroll, clamp, filePath]);

  if (isRawModeSupported) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useInput(handleInput);
  }

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
      <Header filename={filename} isLive={isWatching} lastUpdated={lastUpdated} inkTheme={inkTheme} />

      <Box flexDirection="row" flexGrow={1} overflow="hidden">
        {sidebarOpen && (
          <Sidebar
            entries={tocEntries}
            cursorIndex={toc.cursorIndex}
            activeIndex={toc.activeIndex}
            height={visibleLines}
            inkTheme={inkTheme}
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
        themeMode={themeMode}
        inkTheme={inkTheme}
      />

      {/* Floating markdown preview — rendered last so it layers on top */}
      {preview.isOpen && preview.filePath && (
        <FloatingPreview
          filePath={preview.filePath}
          terminalWidth={terminalWidth}
          terminalHeight={terminalHeight}
          scrollOffset={preview.scrollOffset}
        />
      )}
    </Box>
  );
}
