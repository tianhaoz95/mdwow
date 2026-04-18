# mdwow

A beautiful, live Markdown viewer for the terminal. Open any `.md` file and get a rich, colorful TUI preview that **auto-updates** whenever the file changes on disk.

```
npx mdwow-cli README.md
```

![📷 demo.gif](./asset/demo.gif)

---

## Features

- **Live file watching** — edit your Markdown in any editor and the preview updates instantly
- **Syntax highlighting** — fenced code blocks are highlighted for 200+ languages
- **Mermaid diagrams** — renders flowcharts, sequence diagrams, ER diagrams, and more as ASCII art
- **Table of contents** — press `b` to open a sidebar TOC and jump to any heading
- **Clickable links** — hover or click a link to pin its URL in the status bar for terminal handling
- **Mouse scroll** — scroll with trackpad or mouse wheel
- **Reading width** — adjust content column width with `+` / `-`
- **Vibrant color theme** — H1–H6 each have a distinct color; code, blockquotes, tables all styled
- **Full GFM support** — tables, strikethrough, task lists, and more
- **Keyboard navigation** — vim-style keys throughout
- **Zero config** — works out of the box, no configuration needed

---

## Installation

### Run without installing

```bash
npx mdwow-cli <file>
```

### Install globally

```bash
npm install -g mdwow-cli
mdwow <file>
```

### Examples

```bash
mdwow README.md
mdwow docs/guide.md
mdwow ~/notes/todo.md
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `k` | Scroll up one line |
| `↓` / `j` | Scroll down one line |
| `u` / `PgUp` | Page up |
| `d` / `PgDn` | Page down |
| `g` | Jump to top |
| `G` | Jump to bottom |
| `b` | Toggle table of contents sidebar |
| `+` | Widen content column |
| `-` | Narrow content column |
| `0` | Reset content width |
| `q` / `Ctrl+C` | Quit |

### In the TOC sidebar

| Key | Action |
|-----|--------|
| `↑` / `k` | Move cursor up |
| `↓` / `j` | Move cursor down |
| `Enter` | Jump to heading |
| `b` / `Esc` | Close sidebar |

### Mouse

| Action | Effect |
|--------|--------|
| Scroll wheel | Scroll document |
| Hover over link | Pin URL in status bar |
| Click link | Pin URL in status bar (use terminal's Cmd+click to open) |

---

## Supported Markdown

- **Headings H1–H6** — each level has a distinct color and visual style
- **Paragraphs** — bold, italic, strikethrough, inline code, links
- **Fenced code blocks** — syntax highlighted, language label, bordered
- **Mermaid diagrams** — rendered as Unicode ASCII art inline
- **Blockquotes** — colored left border, supports nesting
- **Lists** — unordered (`•`) and ordered, nested
- **Tables** — GFM tables with aligned columns
- **Horizontal rules**
- **Links** — URL shown in status bar on hover/click
- **Images** — shown as `[image: alt text]` placeholder

---

## Development

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Setup

```bash
git clone https://github.com/tianhaoz95/mdwow.git
cd mdwow
npm install
```

### Run in dev mode

```bash
npm run dev -- README.md
```

Uses `tsx` to run TypeScript directly — no build step needed.

### Preview with test file

```bash
npm run preview
```

Builds and opens `TEST.md`, which exercises all supported Markdown elements.

### Build

```bash
npm run build
```

Bundles everything into `dist/cli.js` using esbuild.

### Test

```bash
npm test            # run all tests once
npm run test:watch  # watch mode
```

344 tests covering the parser, renderer, all node components, mouse/scroll logic, TOC, and link detection.

### Project Structure

```
mdwow/
├── src/
│   ├── cli.tsx                    # Entry point, arg parsing, mouse cleanup
│   ├── app.tsx                    # Root component, input handling, layout
│   ├── theme.ts                   # Color/style constants
│   ├── hooks/
│   │   ├── useFileWatcher.ts      # chokidar live-reload hook
│   │   ├── useMouseScroll.ts      # SGR mouse reporting lifecycle
│   │   └── useToc.ts              # TOC sidebar cursor/active state
│   ├── utils/
│   │   ├── parser.ts              # remark Markdown → AST
│   │   ├── renderer.ts            # AST → ANSI string lines + link spans + TOC
│   │   ├── mouse.ts               # SGR mouse escape sequence parser
│   │   └── openUrl.ts             # Cross-platform URL opener (unused, kept for reference)
│   └── components/
│       ├── Header.tsx             # Top bar (filename, live indicator, timestamp)
│       ├── StatusBar.tsx          # Bottom bar (hints, scroll %, link URL)
│       ├── Sidebar.tsx            # TOC sidebar
│       ├── ErrorView.tsx          # Error display
│       └── nodes/                 # Ink components (used by tests)
│           ├── Heading.tsx
│           ├── Paragraph.tsx
│           ├── InlineContent.tsx
│           ├── CodeBlock.tsx
│           ├── Blockquote.tsx
│           ├── List.tsx
│           ├── Table.tsx
│           └── HorizontalRule.tsx
├── tests/
│   ├── parser.test.ts
│   ├── theme.test.ts
│   ├── renderer.test.ts
│   ├── mouse.test.ts
│   ├── toc.test.ts
│   ├── links.test.ts
│   ├── ui/                        # Visual output tests (ink-testing-library)
│   └── components/                # Component unit tests
├── scripts/
│   ├── preview.sh                 # Build + open TEST.md
│   └── keytest.mjs                # Mouse/keyboard event inspector
├── TEST.md                        # Test document covering all elements
├── design/
│   ├── design.md
│   └── implementation-plan.md
├── build.mjs
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

### Stack

| Tool | Purpose |
|------|---------|
| [Ink](https://github.com/vadimdemedes/ink) | React-based TUI framework |
| [React](https://react.dev/) | Component model |
| [unified](https://unifiedjs.com/) + [remark](https://remark.js.org/) | Markdown parsing |
| [remark-gfm](https://github.com/remarkjs/remark-gfm) | GFM support (tables, strikethrough) |
| [chokidar](https://github.com/paulmillr/chokidar) | Cross-platform file watching |
| [cli-highlight](https://github.com/felixfbecker/cli-highlight) | Terminal syntax highlighting |
| [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) | Mermaid → ASCII art |
| [meow](https://github.com/sindresorhus/meow) | CLI argument parsing |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [esbuild](https://esbuild.github.io/) | Fast bundling |
| [Vitest](https://vitest.dev/) | Testing |

---

## License

MIT
