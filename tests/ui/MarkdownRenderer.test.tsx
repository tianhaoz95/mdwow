/**
 * Integration visual tests for MarkdownRenderer.
 * These test the full pipeline: Markdown string → AST → rendered frame.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { MarkdownRenderer } from '../../src/components/MarkdownRenderer.js';
import { parseMarkdown } from '../../src/utils/parser.js';

function frame(md: string, width = 80) {
  const ast = parseMarkdown(md);
  return render(<MarkdownRenderer ast={ast} terminalWidth={width} />).lastFrame() ?? '';
}

describe('MarkdownRenderer — headings', () => {
  it('H1 renders ═ decorator bars', () => {
    expect(frame('# Title')).toContain('═');
  });

  it('H1 renders text between bars', () => {
    const f = frame('# My Heading');
    expect(f).toContain('My Heading');
    const ls = f.split('\n').filter((l) => l.trim().length > 0);
    const barIdx = ls.findIndex((l) => l.includes('═'));
    const textIdx = ls.findIndex((l) => l.includes('My Heading'));
    expect(textIdx).toBeGreaterThan(barIdx);
  });

  it('H2 renders text with ─ underline', () => {
    const f = frame('## Section');
    expect(f).toContain('Section');
    expect(f).toMatch(/─{10,}/);
  });

  it('H3 renders text with ▸ prefix', () => {
    expect(frame('### Sub')).toContain('▸ Sub');
  });

  it('H4 renders text without prefix', () => {
    expect(frame('#### Detail')).toContain('Detail');
    expect(frame('#### Detail')).not.toContain('####');
  });

  it('H5 renders text without prefix', () => {
    expect(frame('##### Minor')).toContain('Minor');
  });

  it('H6 renders text without prefix', () => {
    expect(frame('###### Tiny')).toContain('Tiny');
  });

  it('no heading level uses # prefix markers', () => {
    for (const depth of [1, 2, 3, 4, 5, 6]) {
      expect(frame('#'.repeat(depth) + ' Test')).not.toContain('#'.repeat(depth));
    }
  });
});

describe('MarkdownRenderer — paragraphs', () => {
  it('renders plain paragraph text', () => {
    expect(frame('Hello world')).toContain('Hello world');
  });

  it('renders bold text in paragraph', () => {
    expect(frame('This is **bold** text')).toContain('bold');
  });

  it('renders italic text in paragraph', () => {
    expect(frame('This is _italic_ text')).toContain('italic');
  });

  it('renders inline code in paragraph', () => {
    const f = frame('Use `npm install` to setup');
    expect(f).toContain('npm install');
  });

  it('renders strikethrough text', () => {
    expect(frame('~~removed~~')).toContain('removed');
  });

  it('renders link label', () => {
    expect(frame('[GitHub](https://github.com)')).toContain('GitHub');
  });

  it('renders image as alt text placeholder', () => {
    expect(frame('![A cat](cat.png)')).toContain('[image: A cat]');
  });

  it('mixed inline: bold, italic, code all appear', () => {
    const f = frame('**bold** and _italic_ and `code`');
    expect(f).toContain('bold');
    expect(f).toContain('italic');
    expect(f).toContain('code');
  });
});

describe('MarkdownRenderer — code blocks', () => {
  it('renders ┌ top border', () => {
    expect(frame('```\ncode\n```')).toContain('┌');
  });

  it('renders └ bottom border', () => {
    expect(frame('```\ncode\n```')).toContain('└');
  });

  it('top and bottom borders have equal length', () => {
    const f = frame('```\nconst x = 1;\n```', 40);
    const top = f.split('\n').find((l) => l.includes('┌'))!;
    const bot = f.split('\n').find((l) => l.includes('└'))!;
    expect(top.length).toBe(bot.length);
  });

  it('renders code content with │ prefix', () => {
    const f = frame('```\nhello world\n```');
    expect(f).toContain('│ hello world');
  });

  it('renders language label in top border', () => {
    const f = frame('```typescript\nconst x: number = 1;\n```');
    const topLine = f.split('\n').find((l) => l.includes('┌'))!;
    expect(topLine).toContain('typescript');
  });

  it('renders multi-line code block', () => {
    const f = frame('```js\nconst a = 1;\nconst b = 2;\n```');
    expect(f).toContain('const a = 1;');
    expect(f).toContain('const b = 2;');
  });
});

describe('MarkdownRenderer — blockquotes', () => {
  it('renders │ prefix on quoted line', () => {
    const f = frame('> A wise quote');
    expect(f).toContain('│');
    expect(f).toContain('A wise quote');
  });

  it('quoted text follows │ with a space', () => {
    const f = frame('> hello');
    expect(f).toContain('│ hello');
  });

  it('renders bold inside blockquote', () => {
    expect(frame('> **important**')).toContain('important');
  });

  it('renders inline code inside blockquote', () => {
    expect(frame('> Use `git pull`')).toContain('git pull');
  });
});

describe('MarkdownRenderer — lists', () => {
  it('renders • for unordered list items', () => {
    const f = frame('- Alpha\n- Beta\n- Gamma');
    expect((f.match(/•/g) ?? []).length).toBe(3);
  });

  it('• precedes item text', () => {
    expect(frame('- Hello')).toContain('• Hello');
  });

  it('renders numbers for ordered list', () => {
    const f = frame('1. First\n2. Second\n3. Third');
    expect(f).toContain('1. First');
    expect(f).toContain('2. Second');
    expect(f).toContain('3. Third');
  });

  it('renders nested list with indentation', () => {
    const md = '- Parent\n  - Child A\n  - Child B';
    const f = frame(md);
    expect(f).toContain('Parent');
    expect(f).toContain('Child A');
    expect(f).toContain('Child B');
    const parentLine = f.split('\n').find((l) => l.includes('Parent'))!;
    const childLine = f.split('\n').find((l) => l.includes('Child A'))!;
    expect(childLine.match(/^\s*/)?.[0]?.length ?? 0)
      .toBeGreaterThan(parentLine.match(/^\s*/)?.[0]?.length ?? 0);
  });
});

describe('MarkdownRenderer — tables', () => {
  const tableMd = '| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |';

  it('renders header cells', () => {
    const f = frame(tableMd);
    expect(f).toContain('Name');
    expect(f).toContain('Age');
  });

  it('renders body cells', () => {
    const f = frame(tableMd);
    expect(f).toContain('Alice');
    expect(f).toContain('Bob');
    expect(f).toContain('30');
    expect(f).toContain('25');
  });

  it('renders │ column separators', () => {
    expect(frame(tableMd)).toContain('│');
  });

  it('renders ├ ┼ ┤ separator row', () => {
    const f = frame(tableMd);
    expect(f).toContain('├');
    expect(f).toContain('┼');
    expect(f).toContain('┤');
  });

  it('separator row has same length as header row', () => {
    const f = frame(tableMd);
    const lines = f.split('\n').filter((l) => l.trim().length > 0);
    expect(lines[1]!.length).toBe(lines[0]!.length);
  });

  it('body rows have same length as header row', () => {
    const f = frame(tableMd);
    const lines = f.split('\n').filter((l) => l.trim().length > 0);
    expect(lines[2]!.length).toBe(lines[0]!.length);
    expect(lines[3]!.length).toBe(lines[0]!.length);
  });
});

describe('MarkdownRenderer — horizontal rule', () => {
  it('renders ─ characters', () => {
    expect(frame('---')).toMatch(/─+/);
  });

  it('rule line contains only ─', () => {
    const f = frame('---');
    const ruleLine = f.split('\n').find((l) => l.includes('─'))!;
    expect(ruleLine.trim()).toMatch(/^─+$/);
  });
});

describe('MarkdownRenderer — full document', () => {
  const fullDoc = `# Main Title

A paragraph with **bold**, _italic_, and \`inline code\`.

## Section One

- Item A
- Item B
- Item C

### Subsection

1. First step
2. Second step

\`\`\`js
console.log("hello");
\`\`\`

> A blockquote with *emphasis*.

---

| Col1 | Col2 |
|------|------|
| foo  | bar  |
| baz  | qux  |
`;

  it('renders all node types without crashing', () => {
    expect(() => frame(fullDoc)).not.toThrow();
  });

  it('renders H1 decorator bars', () => {
    expect(frame(fullDoc)).toContain('═');
  });

  it('renders H2 text with underline', () => {
    expect(frame(fullDoc)).toContain('Section One');
    expect(frame(fullDoc)).toMatch(/─{10,}/);
  });

  it('renders H3 with ▸ prefix', () => {
    expect(frame(fullDoc)).toContain('▸ Subsection');
  });

  it('renders paragraph text', () => {
    const f = frame(fullDoc);
    expect(f).toContain('A paragraph with');
    expect(f).toContain('bold');
    expect(f).toContain('italic');
    expect(f).toContain('inline code');
  });

  it('renders all list items', () => {
    const f = frame(fullDoc);
    expect(f).toContain('• Item A');
    expect(f).toContain('• Item B');
    expect(f).toContain('• Item C');
  });

  it('renders ordered list items', () => {
    const f = frame(fullDoc);
    expect(f).toContain('1. First step');
    expect(f).toContain('2. Second step');
  });

  it('renders code block with borders', () => {
    const f = frame(fullDoc);
    expect(f).toContain('┌');
    expect(f).toContain('└');
    expect(f).toContain('console.log');
  });

  it('renders blockquote with │ prefix', () => {
    const f = frame(fullDoc);
    expect(f).toContain('│ A blockquote');
  });

  it('renders horizontal rule', () => {
    expect(frame(fullDoc)).toMatch(/─{10,}/);
  });

  it('renders table with separators', () => {
    const f = frame(fullDoc);
    expect(f).toContain('Col1');
    expect(f).toContain('foo');
    expect(f).toContain('├');
    expect(f).toContain('┼');
  });

  it('renders empty document without crashing', () => {
    expect(() => frame('')).not.toThrow();
    expect(frame('')).toBe('');
  });
});
