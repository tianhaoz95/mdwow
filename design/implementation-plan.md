# mdwow — Implementation Plan

## Phase 0: Project Scaffold

### 0.1 Initialize npm package

- Create `package.json` with:
  - `name: "mdwow"`
  - `version: "1.0.0"`
  - `type: "module"`
  - `bin: { "mdwow": "./dist/cli.js" }`
  - `engines: { "node": ">=18" }`
  - `files: ["dist"]`
  - Scripts: `build`, `dev`, `test`, `prepublishOnly`

### 0.2 TypeScript configuration

- `tsconfig.json` targeting ESNext, module resolution `bundler`, JSX `react-jsx`, strict mode enabled.

### 0.3 Build configuration

- Use `esbuild` to bundle `src/cli.tsx` → `dist/cli.js` (ESM, node platform).
- Add `#!/usr/bin/env node` banner via esbuild banner option.
- Build script: `node build.mjs`.

### 0.4 Install dependencies

**Runtime:**
```
ink react unified remark-parse chokidar meow
```

**Dev:**
```
typescript tsx esbuild vitest @types/react @types/node
ink-testing-library
```

---

## Phase 1: Core Infrastructure

### 1.1 `src/theme.ts`

Define all color and style constants:

```ts
export const theme = {
  h1: { color: 'magenta', bold: true },
  h2: { color: 'cyan', bold: true },
  h3: { color: 'yellow', bold: true },
  h4: { color: 'blue', bold: true },
  h5: { color: 'blue' },
  h6: { color: 'blue' },
  bold: { bold: true, color: 'white' },
  italic: { italic: true },
  inlineCode: { color: 'yellow', backgroundColor: 'gray' },  // rendered via chalk
  codeBlock: { color: 'green' },
  codeBlockBorder: { color: 'cyan', dimColor: true },
  blockquote: { color: 'white', dimColor: true },
  blockquoteBorder: { color: 'magenta' },
  link: { color: 'blue', underline: true },
  hr: { color: 'cyan', dimColor: true },
  listBullet: { color: 'cyan', bold: true },
  orderedListNumber: { color: 'yellow', bold: true },
  tableHeader: { bold: true, color: 'white' },
  tableSeparator: { color: 'cyan' },
  header: { backgroundColor: 'blue', color: 'white', bold: true },
  liveIndicator: { color: 'green', bold: true },
  statusBar: { dimColor: true },
  error: { color: 'red', bold: true },
  fileRemoved: { color: 'yellow' },
};
```

### 1.2 `src/utils/parser.ts`

Wrap `unified` + `remark-parse` to parse Markdown string → MDAST:

```ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root } from 'mdast';

export function parseMarkdown(content: string): Root {
  return unified().use(remarkParse).parse(content);
}
```

### 1.3 `src/hooks/useFileWatcher.ts`

Custom React hook using `chokidar`:

```ts
export function useFileWatcher(filePath: string): {
  content: string | null;
  error: string | null;
  lastUpdated: Date | null;
  isWatching: boolean;
}
```

- On mount: read file content immediately, set up chokidar watcher.
- On `change` event: re-read file, update `content` state.
- On `unlink` event: set `error` to "File removed".
- On unmount: close watcher.
- Handle read errors gracefully.

### 1.4 `src/hooks/useScrolling.ts`

Manage scroll offset and keyboard navigation:

```ts
export function useScrolling(totalLines: number, visibleLines: number): {
  scrollOffset: number;
  handleInput: (input: string, key: Key) => void;
  scrollBy: (delta: number) => void;
}
```

- Track `scrollOffset` (clamped to `[0, max]`).
- Handle: `↑`/`k` (−1), `↓`/`j` (+1), `u`/`PgUp` (−page), `d`/`PgDn` (+page), `g` (top), `G` (bottom).
- Expose `scrollBy(delta)` so mouse scroll can drive the same offset.

### 1.5 `src/utils/mouse.ts`

Pure parser for SGR extended mouse escape sequences:

```ts
export type MouseEvent = {
  type: 'scroll_up' | 'scroll_down' | 'press' | 'release';
  x: number;
  y: number;
};

// Parses ESC [ < Cb ; Cx ; Cy M/m
export function parseSgrMouse(data: Buffer): MouseEvent | null;
```

- Button byte 64 = scroll up, 65 = scroll down.
- Returns `null` for non-mouse or malformed sequences.

### 1.6 `src/hooks/useMouseScroll.ts`

React hook that enables SGR mouse reporting on mount and tears it down on unmount:

```ts
export function useMouseScroll(onScroll: (delta: number) => void): void;
```

- On mount: write `\x1b[?1000h\x1b[?1002h\x1b[?1006h` to stdout to enable SGR mouse reporting.
- Subscribe to `useStdin().stdin` `data` events; pipe each chunk through `parseSgrMouse`.
- On scroll up → call `onScroll(-3)`, on scroll down → call `onScroll(+3)`.
- On unmount: write `\x1b[?1000l\x1b[?1002l\x1b[?1006l` to restore terminal state.

---

## Phase 2: Markdown Node Components

All components live in `src/components/nodes/`. Each receives the relevant MDAST node and renders Ink `<Text>` / `<Box>` elements.

### 2.1 `Heading.tsx`

Props: `{ node: Heading, depth: 1-6 }`

- H1: Full-width magenta bold line with `═` decorators on each side.
- H2: Cyan bold with `─` partial decorators.
- H3: Yellow bold, no decorators.
- H4–H6: Blue bold/normal.
- Render inline children (bold, italic, code, links within heading).

### 2.2 `Paragraph.tsx`

Props: `{ node: Paragraph }`

- Render inline children as a single `<Text>` with wrapping.
- Handle mixed inline content: text, strong, emphasis, inlineCode, link, image.

### 2.3 `InlineContent.tsx`

Shared helper that recursively renders inline MDAST nodes:

| Node type | Rendering |
|-----------|-----------|
| `text` | Plain `<Text>` |
| `strong` | `<Text bold color="white">` |
| `emphasis` | `<Text italic>` |
| `inlineCode` | `<Text color="yellow" backgroundColor="gray">` with backtick padding |
| `link` | `<Text color="blue" underline>` (show URL in dim if no label) |
| `image` | `<Text dimColor>[image: alt]</Text>` |
| `break` | Newline |
| `html` | Raw text (dim) |

### 2.4 `CodeBlock.tsx`

Props: `{ node: Code }`

- Top border: `┌─ lang ──────┐` (language label in top-right).
- Content: green text, each line prefixed with `│ `.
- Bottom border: `└─────────────┘`.
- All borders use dim cyan color.

### 2.5 `Blockquote.tsx`

Props: `{ node: Blockquote }`

- Each line prefixed with bright magenta `│ `.
- Content rendered dim white.
- Recursively renders child blocks.

### 2.6 `List.tsx`

Props: `{ node: List }`

- Unordered: bullet `•` in bright cyan.
- Ordered: number `N.` in bright yellow.
- Nested lists indented by 2 spaces per level.
- List items may contain inline content or nested blocks.

### 2.7 `Table.tsx`

Props: `{ node: Table }`

- Header row: bold white cells separated by `│` in cyan.
- Separator row: `─` in cyan.
- Body rows: normal white.
- Column widths calculated from content.

### 2.8 `HorizontalRule.tsx`

- Renders a full-width `─────────────────` line in dim cyan.

### 2.9 `ThematicBreak.tsx`

- Alias for `HorizontalRule`.

---

## Phase 3: Layout Components

### 3.1 `src/components/Header.tsx`

```
┌─────────────────────────────────────────┐
│  mdwow  ·  README.md        [live] 14:32│
└─────────────────────────────────────────┘
```

Props: `{ filename: string; isLive: boolean; lastUpdated: Date | null }`

- Left: `mdwow · <filename>` in bold white on blue background.
- Right: `[live]` in green (pulses on update) + timestamp.

### 3.2 `src/components/StatusBar.tsx`

```
↑↓ scroll  ·  q quit  ·  r reload  ·  g top  ·  G bottom
```

Props: `{ scrollOffset: number; totalLines: number }`

- Fixed at bottom.
- Shows keyboard hints in dim text.
- Right side: scroll position `line X / Y`.

### 3.3 `src/components/MarkdownRenderer.tsx`

Props: `{ ast: Root }`

- Iterates `ast.children`, dispatches each node to the correct component.
- Handles unknown node types with a dim fallback.

### 3.4 `src/components/ScrollView.tsx`

Props: `{ children: ReactNode; scrollOffset: number; height: number }`

- Uses Ink's `<Box>` with `overflow: "hidden"` and a negative `marginTop` equal to `scrollOffset`.
- Exposes total line count via a ref/callback for the scroll hook.

### 3.5 `src/components/ErrorView.tsx`

Props: `{ message: string }`

- Centered red error box for fatal errors (file not found, etc.).

---

## Phase 4: App Shell

### 4.1 `src/app.tsx`

Root component:

```tsx
export function App({ filePath }: { filePath: string }) {
  const { content, error, lastUpdated } = useFileWatcher(filePath);
  const ast = useMemo(() => content ? parseMarkdown(content) : null, [content]);
  const { scrollOffset, handleInput } = useScrolling(totalLines, terminalHeight - 4);

  useInput(handleInput);

  return (
    <Box flexDirection="column" height={terminalHeight}>
      <Header filename={basename(filePath)} isLive lastUpdated={lastUpdated} />
      <ScrollView scrollOffset={scrollOffset} height={terminalHeight - 4}>
        {error ? <ErrorView message={error} /> : ast ? <MarkdownRenderer ast={ast} /> : <Spinner />}
      </ScrollView>
      <StatusBar scrollOffset={scrollOffset} totalLines={totalLines} />
    </Box>
  );
}
```

- Uses `useStdout` to get terminal dimensions.
- Uses `useApp` to call `exit()` on `q` / `Ctrl+C`.

### 4.2 `src/cli.tsx`

Entry point:

```tsx
#!/usr/bin/env node
import meow from 'meow';
import { render } from 'ink';
import { App } from './app.js';
import { existsSync } from 'fs';
import { resolve } from 'path';

const cli = meow(`
  Usage: mdwow <file>
  Options:
    --help     Show help
    --version  Show version
`, { importMeta: import.meta });

const [filePath] = cli.input;

if (!filePath) {
  console.error('Error: Please provide a markdown file path.');
  process.exit(1);
}

const resolved = resolve(filePath);
if (!existsSync(resolved)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

render(<App filePath={resolved} />);
```

---

## Phase 5: Build System

### 5.1 `build.mjs`

```js
import { build } from 'esbuild';

await build({
  entryPoints: ['src/cli.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/cli.js',
  banner: { js: '#!/usr/bin/env node' },
  external: ['react', 'ink', 'chokidar'],  // peer deps
  jsx: 'automatic',
  target: 'node18',
});
```

Actually, bundle everything for npx convenience:

```js
await build({
  entryPoints: ['src/cli.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/cli.js',
  banner: { js: '#!/usr/bin/env node' },
  jsx: 'automatic',
  target: 'node18',
  // bundle all deps for zero-install npx usage
});
```

---

## Phase 6: Testing

### 6.1 Test setup

- `vitest.config.ts`: configure vitest with `jsdom` environment for React tests, or `node` for pure unit tests.
- Use `ink-testing-library` for rendering Ink components.

### 6.2 Unit tests

**`tests/parser.test.ts`**
- Test `parseMarkdown` returns valid MDAST for various inputs.
- Test empty string, headings, code blocks, tables, nested lists.

**`tests/theme.test.ts`**
- Verify theme object has all required keys.
- Verify color values are valid chalk/Ink color strings.

**`tests/useScrolling.test.ts`**
- Test scroll offset clamping.
- Test all keyboard shortcuts update offset correctly.
- Test page up/down with various window sizes.

### 6.3 Component tests (ink-testing-library)

**`tests/components/Heading.test.tsx`**
- H1 renders with magenta color marker.
- H2 renders with cyan.
- H3–H6 render with correct colors.

**`tests/components/CodeBlock.test.tsx`**
- Renders top border with language label.
- Renders content lines with `│ ` prefix.
- Renders bottom border.

**`tests/components/Blockquote.test.tsx`**
- Each line has `│ ` prefix.

**`tests/components/List.test.tsx`**
- Unordered list renders `•` bullets.
- Ordered list renders numbers.
- Nested lists indent correctly.

**`tests/components/Table.test.tsx`**
- Header row renders bold.
- Separator row renders.
- Body rows render.

**`tests/components/MarkdownRenderer.test.tsx`**
- Integration: renders a full Markdown document with all node types.
- Snapshot test for stable output.

### 6.4 File watcher tests

**`tests/useFileWatcher.test.ts`**
- Mock `chokidar` and `fs`.
- Verify initial file read.
- Verify state updates on `change` event.
- Verify error state on `unlink`.
- Verify cleanup on unmount.

### 6.5 Mouse parser tests

**`tests/mouse.test.ts`**
- `parseSgrMouse` returns `scroll_up` for button byte 64 (`ESC[<64;1;1M`).
- `parseSgrMouse` returns `scroll_down` for button byte 65 (`ESC[<65;1;1M`).
- `parseSgrMouse` returns `null` for non-mouse data.
- `parseSgrMouse` returns `null` for malformed sequences.
- Coordinates are parsed correctly from the sequence.

---

## Phase 7: Package Configuration

### 7.1 `package.json` final

```json
{
  "name": "mdwow",
  "version": "1.0.0",
  "description": "A beautiful live Markdown viewer for the terminal",
  "type": "module",
  "bin": { "mdwow": "./dist/cli.js" },
  "main": "./dist/cli.js",
  "files": ["dist", "README.md"],
  "engines": { "node": ">=18" },
  "keywords": ["markdown", "cli", "tui", "viewer", "terminal", "ink"],
  "scripts": {
    "build": "node build.mjs",
    "dev": "tsx src/cli.tsx",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "npm run build && npm test"
  }
}
```

### 7.2 `.npmignore` / `files` field

Only ship `dist/` and `README.md`.

---

## Implementation Order

1. `package.json` + `tsconfig.json` + `build.mjs`
2. Install dependencies
3. `src/theme.ts`
4. `src/utils/parser.ts`
5. `src/utils/mouse.ts`
6. `src/hooks/useScrolling.ts` (add `scrollBy`)
7. `src/hooks/useFileWatcher.ts`
8. `src/hooks/useMouseScroll.ts`
9. Node components: `InlineContent`, `Heading`, `Paragraph`, `CodeBlock`, `Blockquote`, `List`, `Table`, `HorizontalRule`
10. Layout components: `Header`, `StatusBar`, `ScrollView`, `ErrorView`, `MarkdownRenderer`
11. `src/app.tsx` (wire `useMouseScroll` → `scrollBy`)
12. `src/cli.tsx`
13. `build.mjs` + `npm run build`
14. Tests (including `tests/mouse.test.ts`)
15. `README.md`
