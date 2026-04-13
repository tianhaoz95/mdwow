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
    expect(frame(1, 'Hello', 40)).toContain('═');
  });

  it('H1 top and bottom decorator bars have equal length', () => {
    const f = frame(1, 'Title', 40);
    const barLines = f.split('\n').filter((l) => l.includes('═'));
    expect(barLines).toHaveLength(2);
    expect(barLines[0]!.length).toBe(barLines[1]!.length);
  });

  it('H1 text is between the two decorator bars', () => {
    const f = frame(1, 'Title', 40);
    const ls = f.split('\n').filter((l) => l.trim().length > 0);
    const barIdx = ls.findIndex((l) => l.includes('═'));
    const textIdx = ls.findIndex((l) => l.includes('Title'));
    expect(textIdx).toBeGreaterThan(barIdx);
    expect(ls.slice(textIdx + 1).some((l) => l.includes('═'))).toBe(true);
  });

  it('H1 text is indented with leading spaces', () => {
    const f = frame(1, 'Title', 40);
    const textLine = f.split('\n').find((l) => l.includes('Title'))!;
    expect(textLine).toMatch(/^\s{2}/);
  });

  it('H1 does not contain # prefix', () => {
    expect(frame(1, 'Title')).not.toContain('#');
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

  it('H2 renders a ─ underline separator', () => {
    const f = frame(2, 'Section');
    expect(f.split('\n').some((l) => l.match(/^─+$/))).toBe(true);
  });

  it('H2 does not contain ## prefix', () => {
    expect(frame(2, 'Section')).not.toContain('##');
  });

  it('H2 has top margin', () => {
    expect(frame(2, 'Section')).toMatch(/^\n/);
  });

  // ── H3 ─────────────────────────────────────────────────────────────────────

  it('H3 renders the heading text', () => {
    expect(frame(3, 'Subsection')).toContain('Subsection');
  });

  it('H3 renders ▸ prefix', () => {
    expect(frame(3, 'Sub')).toContain('▸ Sub');
  });

  it('H3 does not contain ### prefix', () => {
    expect(frame(3, 'Sub')).not.toContain('###');
  });

  // ── H4 ─────────────────────────────────────────────────────────────────────

  it('H4 renders the heading text', () => {
    expect(frame(4, 'Detail')).toContain('Detail');
  });

  it('H4 does not contain #### prefix', () => {
    expect(frame(4, 'Detail')).not.toContain('####');
  });

  // ── H5 ─────────────────────────────────────────────────────────────────────

  it('H5 renders the heading text', () => {
    expect(frame(5, 'Minor')).toContain('Minor');
  });

  // ── H6 ─────────────────────────────────────────────────────────────────────

  it('H6 renders the heading text', () => {
    expect(frame(6, 'Tiny')).toContain('Tiny');
  });

  // ── all levels ─────────────────────────────────────────────────────────────

  it('all heading depths produce non-empty output', () => {
    for (const depth of [1, 2, 3, 4, 5, 6] as const) {
      expect(frame(depth, 'Test').trim().length).toBeGreaterThan(0);
    }
  });
});
