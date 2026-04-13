import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Heading } from '../../src/components/nodes/Heading.js';
import type { Heading as MdastHeading } from 'mdast';

function makeHeading(depth: 1 | 2 | 3 | 4 | 5 | 6, text: string): MdastHeading {
  return { type: 'heading', depth, children: [{ type: 'text', value: text }] };
}

function frame(depth: 1 | 2 | 3 | 4 | 5 | 6, text: string, width = 80) {
  return render(<Heading node={makeHeading(depth, text)} terminalWidth={width} />).lastFrame() ?? '';
}

describe('Heading visual output', () => {
  // ── H1 ─────────────────────────────────────────────────────────────────────

  it('H1 renders the heading text', () => {
    expect(frame(1, 'My Title')).toContain('My Title');
  });

  it('H1 renders ═ decorator bars', () => {
    const f = frame(1, 'Hello', 40);
    expect(f).toContain('═');
  });

  it('H1 top and bottom decorator bars have equal length', () => {
    const f = frame(1, 'Title', 40);
    const lines = f.split('\n').filter((l) => l.includes('═'));
    expect(lines).toHaveLength(2);
    expect(lines[0]!.length).toBe(lines[1]!.length);
  });

  it('H1 text line is between the two decorator bars', () => {
    const f = frame(1, 'Title', 40);
    const lines = f.split('\n').filter((l) => l.trim().length > 0);
    const barIdx = lines.findIndex((l) => l.includes('═'));
    const textIdx = lines.findIndex((l) => l.includes('Title'));
    const lastBarIdx = lines.lastIndexOf(lines.find((l) => l.includes('═'))!);
    expect(textIdx).toBeGreaterThan(barIdx);
    // Text appears before the closing bar
    const closingBarIdx = lines.slice(textIdx + 1).findIndex((l) => l.includes('═'));
    expect(closingBarIdx).toBeGreaterThanOrEqual(0);
  });

  it('H1 has surrounding vertical margin (blank lines)', () => {
    const f = frame(1, 'Title', 40);
    // marginY={1} produces blank lines before and after
    expect(f).toMatch(/^\n/);
    expect(f).toMatch(/\n$/);
  });

  it('H1 text is indented with leading spaces', () => {
    const f = frame(1, 'Title', 40);
    const textLine = f.split('\n').find((l) => l.includes('Title'))!;
    expect(textLine).toMatch(/^\s{2}/);
  });

  it('H1 decorator bar width scales with terminalWidth', () => {
    const narrow = frame(1, 'T', 30);
    const wide = frame(1, 'T', 60);
    const narrowBar = narrow.split('\n').find((l) => l.includes('═'))!;
    const wideBar = wide.split('\n').find((l) => l.includes('═'))!;
    expect(wideBar.length).toBeGreaterThan(narrowBar.length);
  });

  // ── H2 ─────────────────────────────────────────────────────────────────────

  it('H2 renders the heading text', () => {
    expect(frame(2, 'Section')).toContain('Section');
  });

  it('H2 renders ── prefix and suffix', () => {
    const f = frame(2, 'Section');
    expect(f).toContain('── Section ──');
  });

  it('H2 renders a ─ underline separator', () => {
    const f = frame(2, 'Section');
    const lines = f.split('\n').filter((l) => l.trim().length > 0);
    // Second non-empty line should be all dashes
    const underline = lines[1];
    expect(underline).toMatch(/^─+$/);
  });

  it('H2 has top margin (blank line before)', () => {
    const f = frame(2, 'Section');
    expect(f).toMatch(/^\n/);
  });

  // ── H3 ─────────────────────────────────────────────────────────────────────

  it('H3 renders the heading text', () => {
    expect(frame(3, 'Subsection')).toContain('Subsection');
  });

  it('H3 renders ▸ prefix', () => {
    expect(frame(3, 'Sub')).toContain('▸ Sub');
  });

  it('H3 has top margin', () => {
    expect(frame(3, 'Sub')).toMatch(/^\n/);
  });

  // ── H4 ─────────────────────────────────────────────────────────────────────

  it('H4 renders with #### prefix', () => {
    const f = frame(4, 'Detail');
    expect(f).toContain('#### Detail');
  });

  // ── H5 ─────────────────────────────────────────────────────────────────────

  it('H5 renders with ##### prefix', () => {
    const f = frame(5, 'Minor');
    expect(f).toContain('##### Minor');
  });

  // ── H6 ─────────────────────────────────────────────────────────────────────

  it('H6 renders with ###### prefix', () => {
    const f = frame(6, 'Tiny');
    expect(f).toContain('###### Tiny');
  });

  // ── inline formatting in headings ──────────────────────────────────────────

  it('H2 with bold child renders bold text', () => {
    const node: MdastHeading = {
      type: 'heading', depth: 2,
      children: [{ type: 'strong', children: [{ type: 'text', value: 'Bold Section' }] }],
    };
    const f = render(<Heading node={node} />).lastFrame() ?? '';
    expect(f).toContain('Bold Section');
  });

  it('H3 with inline code renders code value', () => {
    const node: MdastHeading = {
      type: 'heading', depth: 3,
      children: [
        { type: 'text', value: 'Use ' },
        { type: 'inlineCode', value: 'npm' },
      ],
    };
    const f = render(<Heading node={node} />).lastFrame() ?? '';
    expect(f).toContain('Use');
    expect(f).toContain('npm');
  });
});
