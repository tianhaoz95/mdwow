import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Blockquote } from '../../src/components/nodes/Blockquote.js';
import type { Blockquote as MdastBlockquote } from 'mdast';

function makeBlockquote(text: string): MdastBlockquote {
  return {
    type: 'blockquote',
    children: [{ type: 'paragraph', children: [{ type: 'text', value: text }] }],
  };
}

function frame(node: MdastBlockquote) {
  return render(<Blockquote node={node} />).lastFrame() ?? '';
}

describe('Blockquote visual output', () => {
  // ── border ─────────────────────────────────────────────────────────────────

  it('every content line has │ prefix', () => {
    const f = frame(makeBlockquote('A quote'));
    const lines = f.split('\n').filter((l) => l.trim().length > 0);
    expect(lines.every((l) => l.includes('│'))).toBe(true);
  });

  it('│ is followed by a space before content', () => {
    const f = frame(makeBlockquote('hello'));
    expect(f).toContain('│ hello');
  });

  it('renders the quoted text', () => {
    expect(frame(makeBlockquote('Some quoted text'))).toContain('Some quoted text');
  });

  // ── multi-paragraph ────────────────────────────────────────────────────────

  it('renders multiple paragraphs each with │ prefix', () => {
    const node: MdastBlockquote = {
      type: 'blockquote',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'First' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'Second' }] },
      ],
    };
    const f = frame(node);
    const prefixedLines = f.split('\n').filter((l) => l.includes('│'));
    expect(prefixedLines.length).toBeGreaterThanOrEqual(2);
    expect(f).toContain('First');
    expect(f).toContain('Second');
  });

  // ── inline formatting inside blockquote ────────────────────────────────────

  it('renders bold text inside blockquote', () => {
    const node: MdastBlockquote = {
      type: 'blockquote',
      children: [{
        type: 'paragraph',
        children: [{ type: 'strong', children: [{ type: 'text', value: 'bold quote' }] }],
      }],
    };
    expect(frame(node)).toContain('bold quote');
  });

  it('renders inline code inside blockquote', () => {
    const node: MdastBlockquote = {
      type: 'blockquote',
      children: [{
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Use ' },
          { type: 'inlineCode', value: 'git pull' },
        ],
      }],
    };
    const f = frame(node);
    expect(f).toContain('Use');
    expect(f).toContain('git pull');
  });

  it('renders link inside blockquote', () => {
    const node: MdastBlockquote = {
      type: 'blockquote',
      children: [{
        type: 'paragraph',
        children: [{
          type: 'link', url: 'https://example.com',
          children: [{ type: 'text', value: 'see here' }],
        }],
      }],
    };
    expect(frame(node)).toContain('see here');
  });

  // ── spacing ────────────────────────────────────────────────────────────────

  it('has trailing newline (marginBottom)', () => {
    expect(frame(makeBlockquote('x'))).toMatch(/\n$/);
  });

  it('is indented (marginLeft)', () => {
    const f = frame(makeBlockquote('x'));
    // The marginLeft=1 means the │ is not at column 0
    const lines = f.split('\n').filter((l) => l.includes('│'));
    expect(lines[0]).toMatch(/^\s+│/);
  });
});
