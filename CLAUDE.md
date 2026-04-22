# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mdwow** is a live Markdown viewer for the terminal — a TUI (Terminal User Interface) tool built with Ink (React for terminals). It renders `.md` files with ANSI colors, syntax highlighting, and ASCII Mermaid diagrams, and auto-updates when the file changes on disk.

## Commands

```bash
npm run build          # Bundle src/cli.tsx → dist/cli.js via esbuild
npm run dev -- <file>  # Run directly with tsx (no build needed, for development)
npm run preview        # Build and open TEST.md (exercises all Markdown elements)
npm test               # Run all Vitest tests once
npm run test:watch     # Run tests in watch mode
```

To run a single test file:
```bash
npx vitest run tests/renderer.test.ts
```

There is no linter configured — TypeScript strict mode is the primary type safety mechanism.

## Architecture

The key architectural insight is a **split rendering model**:

1. **Pure string renderer** (`src/utils/renderer.ts`) — The core `renderToLinesWithLinks()` function converts a Markdown AST into an array of ANSI-colored strings (one per line). Scrolling is instant because it just slices this array. This function also tracks link positions (line/column ranges) for mouse click detection and builds the Table of Contents.

2. **Ink/React UI chrome** (`src/app.tsx` and `src/components/`) — Ink components handle only the interactive UI shell: header, status bar, sidebar TOC, and floating preview. The rendered string lines are passed as props and displayed via `<Text>`.

### Data Flow

```
File on disk → chokidar (useFileWatcher) → parseMarkdown (unified/remark) → MDAST AST
    → renderToLinesWithLinks() → ANSI string lines[] → sliced by scroll offset → Ink renders
```

### Key Files

- `src/cli.tsx` — CLI entry point (meow argument parsing, mouse reporting setup)
- `src/app.tsx` — Root component; owns all state (scroll, theme, TOC, links, floating preview) and keyboard/mouse event handling
- `src/utils/renderer.ts` — Core renderer (~23KB); MDAST → ANSI strings + link metadata + TOC entries
- `src/utils/parser.ts` — Thin wrapper around `unified` + `remark-parse` + `remark-gfm`
- `src/themes.ts` — `RendererTheme` (markdown colors) and `InkTheme` (UI chrome colors) interfaces + dark/light implementations
- `src/hooks/useFileWatcher.ts` — chokidar integration; re-reads file on change
- `src/hooks/useMouseScroll.ts` — Parses raw SGR mouse escape sequences for scroll and click
- `src/hooks/useFloatingPreview.ts` — State for the floating markdown preview modal (triggered by clicking local `.md` links)
- `src/components/nodes/` — Individual Ink components for each Markdown node type (Heading, Paragraph, CodeBlock, etc.)

### Theme System

Two independent theme dimensions, both switchable with the `t` key:
- `RendererTheme` — colors used by `renderer.ts` when generating ANSI strings
- `InkTheme` — colors used by Ink UI components (header, status bar, sidebar)

Both dark and light variants are defined in `src/themes.ts`.

### Testing

Tests live in `tests/`. The file `TEST.md` is a comprehensive Markdown document used for manual visual testing (`npm run preview`). Component tests use `ink-testing-library`.

## CI/CD

GitHub Actions (`.github/workflows/release.yml`) triggers on push to `main`. If `package.json` version changed, it runs tests, builds, publishes to npm via OIDC Trusted Publishers (no classic token), and creates a GitHub release + git tag.
