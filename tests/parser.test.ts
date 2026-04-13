import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../src/utils/parser.js';

describe('parseMarkdown', () => {
  it('parses an empty string to a root node with no children', () => {
    const ast = parseMarkdown('');
    expect(ast.type).toBe('root');
    expect(ast.children).toHaveLength(0);
  });

  it('parses a heading', () => {
    const ast = parseMarkdown('# Hello World');
    expect(ast.children).toHaveLength(1);
    const heading = ast.children[0];
    expect(heading.type).toBe('heading');
    expect((heading as { depth: number }).depth).toBe(1);
  });

  it('parses multiple heading levels', () => {
    const md = '# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6';
    const ast = parseMarkdown(md);
    expect(ast.children).toHaveLength(6);
    ast.children.forEach((node, i) => {
      expect(node.type).toBe('heading');
      expect((node as { depth: number }).depth).toBe(i + 1);
    });
  });

  it('parses a paragraph', () => {
    const ast = parseMarkdown('Hello, world!');
    expect(ast.children).toHaveLength(1);
    expect(ast.children[0].type).toBe('paragraph');
  });

  it('parses inline bold and italic', () => {
    const ast = parseMarkdown('**bold** and _italic_');
    const para = ast.children[0] as { type: string; children: Array<{ type: string }> };
    expect(para.type).toBe('paragraph');
    const types = para.children.map((c) => c.type);
    expect(types).toContain('strong');
    expect(types).toContain('emphasis');
  });

  it('parses a fenced code block', () => {
    const md = '```js\nconsole.log("hello");\n```';
    const ast = parseMarkdown(md);
    expect(ast.children).toHaveLength(1);
    const code = ast.children[0] as { type: string; lang: string; value: string };
    expect(code.type).toBe('code');
    expect(code.lang).toBe('js');
    expect(code.value).toBe('console.log("hello");');
  });

  it('parses a blockquote', () => {
    const ast = parseMarkdown('> This is a quote');
    expect(ast.children[0].type).toBe('blockquote');
  });

  it('parses an unordered list', () => {
    const ast = parseMarkdown('- item 1\n- item 2\n- item 3');
    const list = ast.children[0] as { type: string; ordered: boolean; children: unknown[] };
    expect(list.type).toBe('list');
    expect(list.ordered).toBe(false);
    expect(list.children).toHaveLength(3);
  });

  it('parses an ordered list', () => {
    const ast = parseMarkdown('1. first\n2. second\n3. third');
    const list = ast.children[0] as { type: string; ordered: boolean; children: unknown[] };
    expect(list.type).toBe('list');
    expect(list.ordered).toBe(true);
    expect(list.children).toHaveLength(3);
  });

  it('parses a table', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const ast = parseMarkdown(md);
    expect(ast.children[0].type).toBe('table');
  });

  it('parses a horizontal rule', () => {
    const ast = parseMarkdown('---');
    expect(ast.children[0].type).toBe('thematicBreak');
  });

  it('parses inline code', () => {
    const ast = parseMarkdown('Use `npm install` to install');
    const para = ast.children[0] as { children: Array<{ type: string }> };
    const types = para.children.map((c) => c.type);
    expect(types).toContain('inlineCode');
  });

  it('parses a link', () => {
    const ast = parseMarkdown('[Click here](https://example.com)');
    const para = ast.children[0] as { children: Array<{ type: string; url: string }> };
    const link = para.children.find((c) => c.type === 'link');
    expect(link).toBeDefined();
    expect(link?.url).toBe('https://example.com');
  });

  it('returns consistent results for the same input', () => {
    const md = '# Title\n\nParagraph text.';
    const ast1 = parseMarkdown(md);
    const ast2 = parseMarkdown(md);
    expect(JSON.stringify(ast1)).toBe(JSON.stringify(ast2));
  });
});
