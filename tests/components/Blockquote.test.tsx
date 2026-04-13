import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Blockquote } from '../../src/components/nodes/Blockquote.js';
import type { Blockquote as MdastBlockquote } from 'mdast';

function makeBlockquote(text: string): MdastBlockquote {
  return {
    type: 'blockquote',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', value: text }],
      },
    ],
  };
}

describe('Blockquote component', () => {
  it('renders the quoted text', () => {
    const { lastFrame } = render(<Blockquote node={makeBlockquote('This is a quote')} />);
    expect(lastFrame()).toContain('This is a quote');
  });

  it('renders the border character │', () => {
    const { lastFrame } = render(<Blockquote node={makeBlockquote('hello')} />);
    expect(lastFrame()).toContain('│');
  });

  it('renders multiple paragraphs', () => {
    const node: MdastBlockquote = {
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'First line' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Second line' }],
        },
      ],
    };
    const { lastFrame } = render(<Blockquote node={node} />);
    expect(lastFrame()).toContain('First line');
    expect(lastFrame()).toContain('Second line');
  });
});
