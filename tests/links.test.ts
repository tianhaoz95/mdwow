import { describe, it, expect } from 'vitest';
import { renderToLinesWithLinks, renderToLines } from '../src/utils/renderer.js';
import { parseMarkdown } from '../src/utils/parser.js';

function render(md: string, width = 80) {
  return renderToLinesWithLinks(parseMarkdown(md), width);
}

describe('renderToLinesWithLinks — link detection', () => {
  it('returns no links for plain text', () => {
    expect(render('Just some text.').links).toHaveLength(0);
  });

  it('detects a single link in a paragraph', () => {
    const { links } = render('[GitHub](https://github.com)');
    expect(links).toHaveLength(1);
    expect(links[0]!.url).toBe('https://github.com');
  });

  it('link colStart and colEnd are positive and ordered', () => {
    const { links } = render('[Click here](https://example.com)');
    const link = links[0]!;
    expect(link.colStart).toBeGreaterThanOrEqual(0);
    expect(link.colEnd).toBeGreaterThan(link.colStart);
  });

  it('link colEnd - colStart equals visible label length', () => {
    const { links } = render('[Click here](https://example.com)');
    const link = links[0]!;
    expect(link.colEnd - link.colStart).toBe('Click here'.length);
  });

  it('link with no label uses url as label', () => {
    const { links } = render('[](https://example.com)');
    const link = links[0]!;
    expect(link.colEnd - link.colStart).toBe('https://example.com'.length);
  });

  it('detects multiple links in one paragraph', () => {
    const { links } = render('[A](https://a.com) and [B](https://b.com)');
    expect(links).toHaveLength(2);
    expect(links[0]!.url).toBe('https://a.com');
    expect(links[1]!.url).toBe('https://b.com');
  });

  it('second link colStart is after first link colEnd', () => {
    const { links } = render('[A](https://a.com) and [B](https://b.com)');
    expect(links[1]!.colStart).toBeGreaterThan(links[0]!.colEnd);
  });

  it('lineIndex is within the rendered lines array', () => {
    const { lines, links } = render('[GitHub](https://github.com)');
    links.forEach((l) => {
      expect(l.lineIndex).toBeGreaterThanOrEqual(0);
      expect(l.lineIndex).toBeLessThan(lines.length);
    });
  });

  it('detects a link in a heading', () => {
    const { links } = render('## See [docs](https://docs.example.com)');
    expect(links.some((l) => l.url === 'https://docs.example.com')).toBe(true);
  });

  it('links in headings have correct lineIndex', () => {
    const { lines, links } = render('## See [docs](https://docs.example.com)');
    const link = links.find((l) => l.url === 'https://docs.example.com')!;
    expect(link).toBeDefined();
    // H2 text line is at offset 1 from heading block start
    expect(lines[link.lineIndex]).toContain('docs');
  });

  it('links in H1 have lineIndex pointing to the text line (offset 2)', () => {
    const { lines, links } = render('# See [docs](https://docs.example.com)');
    const link = links.find((l) => l.url === 'https://docs.example.com')!;
    expect(link).toBeDefined();
    expect(lines[link.lineIndex]).toContain('docs');
  });

  it('lines output is unchanged compared to renderToLines', () => {
    const md = 'A paragraph with [a link](https://example.com) in it.';
    const ast = parseMarkdown(md);
    const { lines } = renderToLinesWithLinks(ast, 80);
    const plain = renderToLines(ast, 80);
    expect(lines).toEqual(plain);
  });

  it('no links for code blocks even with URL-like content', () => {
    const { links } = render('```\nhttps://example.com\n```');
    expect(links).toHaveLength(0);
  });

  it('no links for image nodes', () => {
    const { links } = render('![alt](https://example.com/img.png)');
    expect(links).toHaveLength(0);
  });
});
