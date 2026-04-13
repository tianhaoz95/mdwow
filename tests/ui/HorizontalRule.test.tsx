import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { HorizontalRule } from '../../src/components/nodes/HorizontalRule.js';

function frame(width?: number) {
  return render(<HorizontalRule terminalWidth={width} />).lastFrame() ?? '';
}

describe('HorizontalRule visual output', () => {
  it('renders a line of ─ characters', () => {
    expect(frame(40)).toMatch(/─+/);
  });

  it('line contains only ─ characters (no other visible chars)', () => {
    const f = frame(40);
    const ruleLine = f.split('\n').find((l) => l.includes('─'))!;
    expect(ruleLine.trim()).toMatch(/^─+$/);
  });

  it('rule width is terminalWidth - 4 when narrow', () => {
    // terminalWidth=24 → width = min(20, 76) = 20
    const f = frame(24);
    const ruleLine = f.split('\n').find((l) => l.includes('─'))!;
    expect(ruleLine.trim().length).toBe(20);
  });

  it('rule width caps at 76 for wide terminals', () => {
    const f = frame(200);
    const ruleLine = f.split('\n').find((l) => l.includes('─'))!;
    expect(ruleLine.trim().length).toBe(76);
  });

  it('wider terminal produces longer rule', () => {
    const narrow = frame(20);
    const wide = frame(60);
    const narrowLen = narrow.split('\n').find((l) => l.includes('─'))!.trim().length;
    const wideLen = wide.split('\n').find((l) => l.includes('─'))!.trim().length;
    expect(wideLen).toBeGreaterThan(narrowLen);
  });

  it('has trailing newline (marginBottom)', () => {
    expect(frame(40)).toMatch(/\n$/);
  });

  it('is wrapped in a Box (rule line is not the only content, newline follows)', () => {
    const f = frame(40);
    // The Box wrapper means there's at least one newline after the rule
    expect(f.split('\n').length).toBeGreaterThanOrEqual(2);
  });

  it('default width (80) produces 76-char rule', () => {
    const f = frame(80);
    const ruleLine = f.split('\n').find((l) => l.includes('─'))!;
    expect(ruleLine.trim().length).toBe(76);
  });
});
