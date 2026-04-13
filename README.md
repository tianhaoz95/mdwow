# mdwow

A beautiful, live Markdown viewer for the terminal. Open any `.md` file and get a rich, colorful TUI preview that **auto-updates** whenever the file changes on disk.

```
npx mdwow README.md
```

---

## Features

- **Live file watching** — edit your Markdown in any editor and the preview updates instantly
- **Vibrant color theme** — headings, code blocks, blockquotes, tables, and lists are all distinctly styled
- **Full Markdown support** — GFM (GitHub Flavored Markdown): tables, strikethrough, task lists, and more
- **Keyboard navigation** — scroll through long documents with vim-style keys
- **Zero config** — works out of the box, no configuration needed
- **npx friendly** — run without installing: `npx mdwow file.md`

---

## Preview

```
┌─────────────────────────────────────────────────────────┐
│  mdwow  ·  README.md                    ⬤ live  10:32:01│
├─────────────────────────────────────────────────────────┤
│  ═══════════════════════════════════════                 │
│    My Project                                           │
│  ═══════════════════════════════════════                 │
│                                                         │
│  A paragraph with bold and italic text.                 │
│                                                         │
│  ── Features ──                                         │
│  ────────────────────────────────────                   │
│                                                         │
│  • Live file watching                                   │
│  • Vibrant color theme                                  │
│                                                         │
│  ┌─ js ──────────────────────────────┐                  │
│  │ console.log("hello world");       │                  │
│  └───────────────────────────────────┘                  │
│                                                         │
│  │ A blockquote with a colored border                   │
├─────────────────────────────────────────────────────────┤
│  ↑↓/jk scroll  ·  u/d page  ·  g/G top/bottom  ·  q quit│
└─────────────────────────────────────────────────────────┘
```

---

## Usage

### Run without installing

```bash
npx mdwow <file>
```

### Install globally

```bash
npm install -g mdwow
mdwow <file>
```

### Install from GitHub

```bash
npx github:tianhaozhou/mdwow <file>
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
| `r` | Force reload |
| `q` / `Ctrl+C` | Quit |

---

## Supported Markdown

- Headings (H1–H6) with distinct visual styles
- Paragraphs with **bold**, _italic_, and ~~strikethrough~~ inline formatting
- `Inline code` with highlighted background
- Fenced code blocks with language label and border
- Blockquotes with colored left border
- Unordered and ordered lists (with nesting)
- Tables (GFM)
- Horizontal rules
- Links and images (images shown as alt text)

---

## Development

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Setup

```bash
git clone https://github.com/tianhaozhou/mdwow.git
cd mdwow
npm install
```

### Run in dev mode

```bash
npm run dev -- README.md
```

This uses `tsx` to run TypeScript directly without a build step.

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

Tests use [Vitest](https://vitest.dev/) and [ink-testing-library](https://github.com/vadimdemedes/ink-testing-library).

### Project Structure

```
mdwow/
├── src/
│   ├── cli.tsx                    # Entry point, arg parsing
│   ├── app.tsx                    # Root Ink component
│   ├── theme.ts                   # Color/style constants
│   ├── hooks/
│   │   ├── useFileWatcher.ts      # chokidar file watcher hook
│   │   └── useScrolling.ts        # Scroll state + keyboard handler
│   ├── utils/
│   │   └── parser.ts              # remark Markdown → AST
│   └── components/
│       ├── Header.tsx             # Top bar (filename, live indicator)
│       ├── StatusBar.tsx          # Bottom bar (keyboard hints, scroll position)
│       ├── MarkdownRenderer.tsx   # AST → Ink components dispatcher
│       ├── ErrorView.tsx          # Error display
│       └── nodes/
│           ├── Heading.tsx        # H1–H6
│           ├── Paragraph.tsx      # Paragraphs
│           ├── InlineContent.tsx  # Inline formatting (bold, italic, code, links)
│           ├── CodeBlock.tsx      # Fenced code blocks
│           ├── Blockquote.tsx     # Blockquotes
│           ├── List.tsx           # Ordered and unordered lists
│           ├── Table.tsx          # GFM tables
│           └── HorizontalRule.tsx # Thematic breaks
├── tests/
│   ├── parser.test.ts
│   ├── theme.test.ts
│   ├── useScrolling.test.ts
│   └── components/
│       ├── Heading.test.tsx
│       ├── CodeBlock.test.tsx
│       ├── Blockquote.test.tsx
│       ├── List.test.tsx
│       ├── Table.test.tsx
│       └── MarkdownRenderer.test.tsx
├── design/
│   ├── design.md                  # Design document
│   └── implementation-plan.md    # Implementation plan
├── build.mjs                      # esbuild bundle script
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
| [meow](https://github.com/sindresorhus/meow) | CLI argument parsing |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [esbuild](https://esbuild.github.io/) | Fast bundling |
| [Vitest](https://vitest.dev/)) | Testing |

---

## License

MIT
