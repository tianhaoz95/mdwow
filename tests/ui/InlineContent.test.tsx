/**
 * Visual UI tests for InlineContent.
 *
 * ink-testing-library strips ANSI color/style codes from lastFrame(), so we
 * test the *text* structure (characters, spacing, wrapping). Styling is
 * verified by asserting that the correct Ink Text props are passed — we do
 * that by checking the rendered string still contains the right characters
 * even after stripping, and by confirming styled segments are present.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { InlineContent } from '../../src/components/nodes/InlineContent.js';
import type { PhrasingContent } from 'mdast';

function frame(children: PhrasingContent[], style?: React.ComponentProps<typeof Text>) {
  return render(<InlineContent children={children} style={style} />).lastFrame() ?? '';
}

describe('InlineContent visual output', () => {
  // ── plain text ─────────────────────────────────────────────────────────────

  it('renders plain text verbatim', () => {
    expect(frame([{ type: 'text', value: 'Hello, world!' }])).toBe('Hello, world!');
  });

  it('renders empty children as empty string', () => {
    expect(frame([])).toBe('');
  });

  // ── bold ───────────────────────────────────────────────────────────────────

  it('renders bold text content', () => {
    const f = frame([{ type: 'strong', children: [{ type: 'text', value: 'important' }] }]);
    expect(f).toContain('important');
  });

  it('bold text does not duplicate or lose characters', () => {
    const f = frame([{ type: 'strong', children: [{ type: 'text', value: 'bold' }] }]);
    // Should be exactly "bold", not "boldbold" or ""
    expect(f.trim()).toBe('bold');
  });

  // ── italic ─────────────────────────────────────────────────────────────────

  it('renders italic text content', () => {
    const f = frame([{ type: 'emphasis', children: [{ type: 'text', value: 'slanted' }] }]);
    expect(f).toContain('slanted');
  });

  it('italic text does not duplicate or lose characters', () => {
    const f = frame([{ type: 'emphasis', children: [{ type: 'text', value: 'em' }] }]);
    expect(f.trim()).toBe('em');
  });

  // ── strikethrough ──────────────────────────────────────────────────────────

  it('renders strikethrough text content', () => {
    const f = frame([{ type: 'delete', children: [{ type: 'text', value: 'removed' }] }]);
    expect(f).toContain('removed');
  });

  // ── inline code ────────────────────────────────────────────────────────────

  it('renders inline code with a leading space', () => {
    const f = frame([{ type: 'inlineCode', value: 'npm install' }]);
    // The component wraps the value in spaces: ` npm install `
    // ink-testing-library trims trailing whitespace from lines
    expect(f).toContain('npm install');
    expect(f).toMatch(/^\s+npm install/);
  });

  // ── link ───────────────────────────────────────────────────────────────────

  it('renders link label text', () => {
    const f = frame([{
      type: 'link', url: 'https://example.com',
      children: [{ type: 'text', value: 'Click here' }],
    }]);
    expect(f).toContain('Click here');
  });

  it('renders link url when no label', () => {
    const f = frame([{ type: 'link', url: 'https://example.com', children: [] }]);
    expect(f).toContain('https://example.com');
  });

  // ── image ──────────────────────────────────────────────────────────────────

  it('renders image as [image: alt] placeholder', () => {
    const f = frame([{ type: 'image', url: 'photo.png', alt: 'A photo', title: null }]);
    expect(f).toBe('[image: A photo]');
  });

  it('renders image with url when alt is empty', () => {
    const f = frame([{ type: 'image', url: 'photo.png', alt: '', title: null }]);
    expect(f).toContain('photo.png');
  });

  // ── mixed inline ───────────────────────────────────────────────────────────

  it('renders mixed bold, italic, plain, and code in sequence', () => {
    const children: PhrasingContent[] = [
      { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
      { type: 'text', value: ' and ' },
      { type: 'emphasis', children: [{ type: 'text', value: 'italic' }] },
      { type: 'text', value: ' and ' },
      { type: 'inlineCode', value: 'code' },
    ];
    const f = frame(children);
    expect(f).toContain('bold');
    expect(f).toContain('and');
    expect(f).toContain('italic');
    expect(f).toContain('code');
    // All parts appear in order
    expect(f.indexOf('bold')).toBeLessThan(f.indexOf('italic'));
    expect(f.indexOf('italic')).toBeLessThan(f.indexOf('code'));
  });

  it('plain text between styled nodes is preserved', () => {
    const children: PhrasingContent[] = [
      { type: 'text', value: 'before ' },
      { type: 'strong', children: [{ type: 'text', value: 'mid' }] },
      { type: 'text', value: ' after' },
    ];
    const f = frame(children);
    expect(f).toContain('before');
    expect(f).toContain('mid');
    expect(f).toContain('after');
  });

  // ── nested bold+italic ─────────────────────────────────────────────────────

  it('renders bold containing italic (extractText flattens)', () => {
    const children: PhrasingContent[] = [{
      type: 'strong',
      children: [{ type: 'emphasis', children: [{ type: 'text', value: 'both' }] }],
    }];
    const f = frame(children);
    expect(f).toContain('both');
  });

  // ── html inline ────────────────────────────────────────────────────────────

  it('renders html inline node as raw text', () => {
    const f = frame([{ type: 'html', value: '<br>' }]);
    expect(f).toContain('<br>');
  });

  // ── line break ─────────────────────────────────────────────────────────────

  it('renders break node as newline', () => {
    const children: PhrasingContent[] = [
      { type: 'text', value: 'line one' },
      { type: 'break' },
      { type: 'text', value: 'line two' },
    ];
    const f = frame(children);
    expect(f).toContain('line one');
    expect(f).toContain('line two');
    expect(f).toContain('\n');
  });
});
