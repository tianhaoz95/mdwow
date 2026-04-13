import { describe, it, expect } from 'vitest';
import { buildToc, renderToLines } from '../src/utils/renderer.js';
import { parseMarkdown } from '../src/utils/parser.js';

function toc(md: string, width = 80) {
  return buildToc(parseMarkdown(md), width);
}

describe('buildToc', () => {
  it('returns empty array for document with no headings', () => {
    expect(toc('Just a paragraph.')).toHaveLength(0);
  });

  it('returns one entry for a single heading', () => {
    const entries = toc('# Hello');
    expect(entries).toHaveLength(1);
    expect(entries[0]!.text).toBe('Hello');
    expect(entries[0]!.depth).toBe(1);
  });

  it('extracts correct depth for each heading level', () => {
    const md = '# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6';
    const entries = toc(md);
    expect(entries).toHaveLength(6);
    entries.forEach((e, i) => expect(e.depth).toBe(i + 1));
  });

  it('extracts plain text (no ANSI codes) for heading text', () => {
    const entries = toc('## **Bold** heading');
    expect(entries[0]!.text).toBe('Bold heading');
    // No ANSI escape codes
    expect(entries[0]!.text).not.toMatch(/\x1b\[/);
  });

  it('H1 lineIndex points to the text line (offset 2 from start of heading block)', () => {
    // H1 emits: ['', bar, text, bar, ''] — text is at index 2
    const entries = toc('# Title');
    expect(entries[0]!.lineIndex).toBe(2);
  });

  it('H2 lineIndex points to the text line (offset 1 from start of heading block)', () => {
    // H2 emits: ['', text, underline] — text is at index 1
    const entries = toc('## Section');
    expect(entries[0]!.lineIndex).toBe(1);
  });

  it('H3 lineIndex points to the text line (offset 1)', () => {
    const entries = toc('### Sub');
    expect(entries[0]!.lineIndex).toBe(1);
  });

  it('lineIndex increases monotonically across headings', () => {
    const md = '# First\n\nA paragraph.\n\n## Second\n\n### Third';
    const entries = toc(md);
    expect(entries).toHaveLength(3);
    expect(entries[0]!.lineIndex).toBeLessThan(entries[1]!.lineIndex);
    expect(entries[1]!.lineIndex).toBeLessThan(entries[2]!.lineIndex);
  });

  it('lineIndex accounts for paragraphs between headings', () => {
    const noContent = toc('# A\n\n## B');
    const withContent = toc('# A\n\nA long paragraph here.\n\n## B');
    // The second heading should be further down when there is content between them
    expect(withContent[1]!.lineIndex).toBeGreaterThan(noContent[1]!.lineIndex);
  });

  it('lineIndex accounts for code blocks between headings', () => {
    const noCode = toc('# A\n\n## B');
    const withCode = toc('# A\n\n```js\nconst x = 1;\n```\n\n## B');
    expect(withCode[1]!.lineIndex).toBeGreaterThan(noCode[1]!.lineIndex);
  });

  it('handles headings with inline formatting', () => {
    const entries = toc('## `code` and **bold**');
    expect(entries[0]!.text).toContain('code');
    expect(entries[0]!.text).toContain('bold');
  });

  it('lineIndex is 0-based and within rendered line count', () => {
    const md = '# Title\n\nParagraph\n\n## Section';
    const ast = parseMarkdown(md);
    const lines = renderToLines(ast, 80);
    const entries = buildToc(ast, 80);
    entries.forEach((e) => {
      expect(e.lineIndex).toBeGreaterThanOrEqual(0);
      expect(e.lineIndex).toBeLessThan(lines.length);
    });
  });
});

describe('buildToc — Sidebar display', () => {
  it('entries have text suitable for display (non-empty)', () => {
    const entries = toc('# Hello\n## World');
    entries.forEach((e) => expect(e.text.trim().length).toBeGreaterThan(0));
  });

  it('depth 1 entries come before depth 2 entries in order', () => {
    const entries = toc('# Top\n## Sub\n# Another Top');
    expect(entries[0]!.depth).toBe(1);
    expect(entries[1]!.depth).toBe(2);
    expect(entries[2]!.depth).toBe(1);
  });
});
