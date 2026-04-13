# mdwow — Design Document

## Overview

`mdwow` is a CLI tool that renders Markdown files in a beautiful, interactive TUI (Terminal User Interface) with live file watching. When the source file changes on disk, the preview updates automatically — no manual refresh required.

---

## Goals

- **Instant preview**: Open any `.md` file and see a rich, colorful render immediately.
- **Live reload**: Watch the file for changes and re-render without user interaction.
- **Delightful visuals**: Use vibrant colors, clear typography hierarchy, and visual cues that make reading Markdown in a terminal pleasant.
- **Zero configuration**: Works out of the box with `npx mdwow file.md`.
- **Keyboard-friendly**: Navigate long documents with keyboard shortcuts.
- **Mouse scroll**: Scroll the document with the mouse wheel naturally.

---

## Non-Goals

- Editing the Markdown file (read-only viewer).
- Rendering HTML or other formats.
- Syncing scroll position with an external editor.
- Supporting remote URLs (local files only, v1).

---

## User Experience

### Invocation

```
npx mdwow README.md
mdwow docs/guide.md
```

### TUI Layout

```
┌──────────────────────────────────────────────────────┐
│  mdwow  ·  README.md                    [live] 14:32 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  # My Project                                        │
│                                                      │
│  A short description paragraph with **bold** and    │
│  _italic_ text, rendered inline.                     │
│                                                      │
│  ## Features                                         │
│                                                      │
│  • Live file watching                                │
│  • Vibrant color theme                               │
│                                                      │
│  ```js                                               │
│  console.log("hello world");                         │
│  ```                                                 │
│                                                      │
│  > A blockquote rendered with a colored left border  │
│                                                      │
├──────────────────────────────────────────────────────┤
│  ↑↓ scroll  · q quit  · r reload                    │
└──────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `q` / `Ctrl+C` | Quit |
| `↑` / `k` | Scroll up |
| `↓` / `j` | Scroll down |
| `PgUp` / `u` | Page up |
| `PgDn` / `d` | Page down |
| `g` | Jump to top |
| `G` | Jump to bottom |
| `r` | Force reload |

### Mouse Support

| Action | Effect |
|--------|--------|
| Scroll wheel up | Scroll document up (3 lines per tick) |
| Scroll wheel down | Scroll document down (3 lines per tick) |

Mouse scroll is enabled automatically on startup by writing the ANSI escape sequence `\x1b[?1000h\x1b[?1002h\x1b[?1006h` to stdout (enables SGR mouse reporting mode). On exit the sequence `\x1b[?1000l\x1b[?1002l\x1b[?1006l` restores the terminal to its original state.

---

## Visual Design

### Color Palette

The theme uses a vibrant, dark-terminal-friendly palette:

| Element | Color / Style |
|---------|--------------|
| H1 | Bright magenta, bold, underline |
| H2 | Bright cyan, bold |
| H3 | Bright yellow, bold |
| H4–H6 | Bright blue |
| Bold text | Bright white, bold |
| Italic text | Italic (terminal italic) |
| Inline code | Bright yellow on dark gray background |
| Code block | Bright green text on dark background with border |
| Blockquote | Dim text, bright magenta left border `│` |
| Links | Bright blue, underline |
| Horizontal rule | Dim cyan `─` repeated |
| List bullet | Bright cyan `•` |
| Ordered list number | Bright yellow |
| Table header | Bold, bright white, cyan separator |
| Table cell | Normal white |
| Header bar | Bold, dark background |
| Status bar | Dim, shows filename + live indicator |

### Typography Hierarchy

Headings use progressively smaller visual weight:
- H1: `═══ TITLE ═══` style with full-width decorators
- H2: `── Section ──` with partial decorators
- H3–H6: Plain bold with color differentiation

### Code Blocks

Fenced code blocks get a top/bottom border line and syntax-highlighted text (via language tag when available). A language label appears in the top-right corner of the block.

---

## Architecture

### Component Tree (Ink)

```
<App>
  ├── <Header>          filename, live indicator, timestamp
  ├── <ScrollView>      virtualized scroll container
  │   └── <MarkdownRenderer>
  │       ├── <Heading>
  │       ├── <Paragraph>
  │       ├── <CodeBlock>
  │       ├── <Blockquote>
  │       ├── <List>
  │       ├── <Table>
  │       ├── <HorizontalRule>
  │       └── <Image>   (alt text fallback)
  └── <StatusBar>       keyboard hints
```

### Data Flow

```
File on disk
    │
    ▼
FileWatcher (chokidar)
    │  onChange event
    ▼
parse(content) → AST (remark/unified)
    │
    ▼
React state update → re-render
    │
    ▼
Ink renders to terminal
```

### Key Modules

| Module | Responsibility |
|--------|---------------|
| `src/cli.tsx` | Entry point, argument parsing |
| `src/app.tsx` | Root Ink component, state management |
| `src/components/Header.tsx` | Top bar |
| `src/components/StatusBar.tsx` | Bottom bar |
| `src/components/MarkdownRenderer.tsx` | AST → Ink components |
| `src/components/nodes/` | One component per Markdown node type |
| `src/hooks/useFileWatcher.ts` | chokidar watcher hook |
| `src/hooks/useScrolling.ts` | Scroll state + keyboard handler |
| `src/hooks/useMouseScroll.ts` | Raw stdin mouse event parser + scroll callback |
| `src/utils/parser.ts` | remark parse wrapper |
| `src/utils/mouse.ts` | SGR mouse escape sequence parser |
| `src/theme.ts` | Color/style constants |

---

## Dependencies

### Runtime

| Package | Purpose |
|---------|---------|
| `ink` | React-based TUI framework |
| `react` | Component model |
| `unified` + `remark-parse` | Markdown → AST |
| `chokidar` | Cross-platform file watching |
| `chalk` | Terminal color utilities (used inside Ink Text) |
| `meow` | CLI argument/flag parsing |
| `ink-spinner` | Loading spinner while parsing |

### Dev / Build

| Package | Purpose |
|---------|---------|
| `typescript` | Type safety |
| `tsx` | TypeScript execution for dev |
| `esbuild` | Fast bundling for distribution |
| `vitest` | Unit testing |
| `@inkjs/ui` | (optional) pre-built Ink UI primitives |

---

## Distribution

The package is published to npm so users can run:

```bash
npx mdwow README.md
# or
npm install -g mdwow
mdwow README.md
```

The `package.json` `bin` field points to the compiled entry point. A `#!/usr/bin/env node` shebang is included.

---

## Error Handling

| Scenario | Behavior |
|----------|---------|
| File not found | Print error message + exit 1 |
| File not readable | Print error message + exit 1 |
| Parse error | Show error inline in TUI, keep watching |
| File deleted while watching | Show "file removed" notice, keep TUI open |
| Terminal too narrow | Show minimum-width warning |

---

## Testing Strategy

- **Unit tests**: Parser utilities, theme helpers, individual node renderers (using `ink-testing-library`).
- **Integration tests**: Full render snapshots for common Markdown patterns.
- **File watcher tests**: Mock `chokidar` to verify re-render on change events.
- **Mouse parser tests**: Unit-test `parseSgrMouse` with raw byte sequences for scroll up/down, button events, and malformed input.

---

## Future Enhancements (v2+)

- Syntax highlighting in code blocks (using `highlight.js` or `shiki`).
- Remote URL support (`mdwow https://...`).
- Multiple file tabs.
- Search / `grep` within document.
- Export rendered output as HTML.
- Config file (`~/.mdwowrc`) for theme customization.
