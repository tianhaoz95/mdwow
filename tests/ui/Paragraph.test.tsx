import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Paragraph } from '../../src/components/nodes/Paragraph.js';
import type { Paragraph as MdastParagraph } from 'mdast';

function makeParagraph(text: string): MdastParagraph {
  return { type: 'paragraph', children: [{ type: 'text', value: text }] };
}

function frame(node: MdastParagraph) {
  return render(<Paragraph node={node} />).lastFrame() ?? '';
}

describe('Paragraph visual output', () => {
  it('renders plain text content', () => {
    expect(frame(makeParagraph('Hello, world!'))).toContain('Hello, world!');
  });

  it('renders bold text inside paragraph', () => {
    const node: MdastParagraph = {
      type: 'paragraph',
      children: [{ type: 'strong', children: [{ type: 'text', value: 'bold' }] }],
    };
    expect(frame(node)).toContain('bold');
  });

  it('renders italic text inside paragraph', () => {
    const node: MdastParagraph = {
      type: 'paragraph',
      children: [{ type: 'emphasis', children: [{ type: 'text', value: 'italic' }] }],
    };
    expect(frame(node)).toContain('italic');
  });

  it('renders inline code inside paragraph', () => {
    const node: MdastParagraph = {
      type: 'paragraph',
      children: [
        { type: 'text', value: 'Run ' },
        { type: 'inlineCode', value: 'npm install' },
      ],
    };
    const f = frame(node);
    expect(f).toContain('Run');
    expect(f).toContain('npm install');
  });

  it('renders link label inside paragraph', () => {
    const node: MdastParagraph = {
      type: 'paragraph',
      children: [{
        type: 'link', url: 'https://example.com',
        children: [{ type: 'text', value: 'Example' }],
      }],
    };
    expect(frame(node)).toContain('Example');
  });

  it('renders mixed inline content in order', () => {
    const node: MdastParagraph = {
      type: 'paragraph',
      children: [
        { type: 'text', value: 'See ' },
        { type: 'strong', children: [{ type: 'text', value: 'this' }] },
        { type: 'text', value: ' for ' },
        { type: 'emphasis', children: [{ type: 'text', value: 'details' }] },
      ],
    };
    const f = frame(node);
    expect(f).toContain('See');
    expect(f).toContain('this');
    expect(f).toContain('for');
    expect(f).toContain('details');
    expect(f.indexOf('See')).toBeLessThan(f.indexOf('this'));
    expect(f.indexOf('this')).toBeLessThan(f.indexOf('details'));
  });

  it('has trailing newline (marginBottom)', () => {
    expect(frame(makeParagraph('x'))).toMatch(/\n$/);
  });

  it('does not add any border characters', () => {
    const f = frame(makeParagraph('plain text'));
    expect(f).not.toContain('│');
    expect(f).not.toContain('┌');
    expect(f).not.toContain('└');
  });
});
