import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { MarkdownRenderer } from '../../src/components/MarkdownRenderer.js';
import { parseMarkdown } from '../../src/utils/parser.js';

describe('MarkdownRenderer', () => {
  it('renders a heading', () => {
    const ast = parseMarkdown('# Hello World');
    const { lastFrame } = render(<MarkdownRenderer ast={ast} />);
    expect(lastFrame()).toContain('Hello World');
  });

  it('renders a paragraph', () => {
    const ast = parseMarkdown('This is a paragraph.');
    const { lastFrame } = render(<MarkdownRenderer ast={ast} />);
    expect(lastFrame()).toContain('This is a paragraph.');
  });

  it('renders a code block', () => {
    const ast = parseMarkdown('```\nconst x = 1;\n```');
    const { lastFrame } = render(<MarkdownRenderer ast={ast} />);
    expect(lastFrame()).toContain('const x = 1;');
    expect(lastFrame()).toContain('┌');
  });

  it('renders a blockquote', () => {
    const ast = parseMarkdown('> A quoted line');
    const { lastFrame } = render(<MarkdownRenderer ast={ast} />);
    expect(lastFrame()).toContain('A quoted line');
    expect(lastFrame()).toContain('│');
  });

  it('renders an unordered list', () => {
    const ast = parseMarkdown('- item one\n- item two');
    const { lastFrame } = render(<MarkdownRenderer ast={ast} />);
    expect(lastFrame()).toContain('item one');
    expect(lastFrame()).toContain('item two');
    expect(lastFrame()).toContain('•');
  });

  it('renders a table', () => {
    const ast = parseMarkdown('| Col1 | Col2 |\n|------|------|\n| A    | B    |');
    const { lastFrame } = render(<MarkdownRenderer ast={ast} />);
    expect(lastFrame()).toContain('Col1');
    expect(lastFrame()).toContain('Col2');
    expect(lastFrame()).toContain('A');
    expect(lastFrame()).toContain('B');
  });

  it('renders a horizontal rule', () => {
    const ast = parseMarkdown('---');
    const { lastFrame } = render(<MarkdownRenderer ast={ast} />);
    expect(lastFrame()).toContain('─');
  });

  it('renders a complex document with multiple node types', () => {
    const md = `# Title

A paragraph with **bold** and _italic_ text.

## Section

- Item 1
- Item 2

\`\`\`js
console.log("hello");
\`\`\`

> A blockquote

---

| Name | Value |
|------|-------|
| foo  | bar   |
`;
    const ast = parseMarkdown(md);
    const { lastFrame } = render(<MarkdownRenderer ast={ast} />);
    const frame = lastFrame();

    expect(frame).toContain('Title');
    expect(frame).toContain('A paragraph with');
    expect(frame).toContain('bold');
    expect(frame).toContain('italic');
    expect(frame).toContain('Section');
    expect(frame).toContain('Item 1');
    expect(frame).toContain('Item 2');
    expect(frame).toContain('console.log');
    expect(frame).toContain('A blockquote');
    expect(frame).toContain('─');
    expect(frame).toContain('Name');
    expect(frame).toContain('foo');
  });

  it('renders inline code in paragraphs', () => {
    const ast = parseMarkdown('Use `npm install` to get started.');
    const { lastFrame } = render(<MarkdownRenderer ast={ast} />);
    expect(lastFrame()).toContain('npm install');
  });

  it('renders links', () => {
    const ast = parseMarkdown('[GitHub](https://github.com)');
    const { lastFrame } = render(<MarkdownRenderer ast={ast} />);
    expect(lastFrame()).toContain('GitHub');
  });

  it('renders an empty document without crashing', () => {
    const ast = parseMarkdown('');
    expect(() => render(<MarkdownRenderer ast={ast} />)).not.toThrow();
  });
});
