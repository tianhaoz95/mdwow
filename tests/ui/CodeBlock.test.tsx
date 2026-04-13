import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { CodeBlock } from '../../src/components/nodes/CodeBlock.js';
import type { Code } from 'mdast';

function makeCode(value: string, lang?: string | null): Code {
  return { type: 'code', value, lang: lang ?? null, meta: null };
}

function frame(value: string, lang?: string | null, width = 40) {
  return render(<CodeBlock node={makeCode(value, lang)} terminalWidth={width} />).lastFrame() ?? '';
}

// Count visible characters in a string (no ANSI codes since ink-testing-library strips them)
const len = (s: string) => s.length;

describe('CodeBlock visual output', () => {
  // ── borders ────────────────────────────────────────────────────────────────

  it('renders ┌ top-left corner', () => {
    expect(frame('x')).toContain('┌');
  });

  it('renders ┐ top-right corner', () => {
    expect(frame('x')).toContain('┐');
  });

  it('renders └ bottom-left corner', () => {
    expect(frame('x')).toContain('└');
  });

  it('renders ┘ bottom-right corner', () => {
    expect(frame('x')).toContain('┘');
  });

  it('renders ─ dashes in top border', () => {
    expect(frame('x')).toMatch(/┌─+/);
  });

  it('renders ─ dashes in bottom border', () => {
    expect(frame('x')).toMatch(/└─+┘/);
  });

  it('top border and bottom border have equal length', () => {
    const f = frame('const x = 1;', null, 40);
    const lines = f.split('\n');
    // First non-empty line = top border (with leading space from marginLeft)
    const topLine = lines.find((l) => l.includes('┌'))!;
    const bottomLine = lines.find((l) => l.includes('└'))!;
    expect(len(topLine)).toBe(len(bottomLine));
  });

  it('each code line is prefixed with │ ', () => {
    const f = frame('line1\nline2\nline3');
    const contentLines = f.split('\n').filter((l) => l.includes('│ '));
    expect(contentLines).toHaveLength(3);
  });

  // ── language label ─────────────────────────────────────────────────────────

  it('shows language label in top border when lang is set', () => {
    expect(frame('x = 1', 'python')).toContain('python');
  });

  it('language label appears in the top border line', () => {
    const f = frame('x', 'js', 40);
    const topLine = f.split('\n').find((l) => l.includes('┌'))!;
    expect(topLine).toContain('js');
  });

  it('no language label when lang is null', () => {
    const f = frame('x', null, 40);
    const topLine = f.split('\n').find((l) => l.includes('┌'))!;
    // Should only contain ┌, ─, and ┐
    expect(topLine.replace(/[\s┌─┐]/g, '')).toBe('');
  });

  it('top border with lang still has equal length to bottom border', () => {
    const f = frame('x', 'typescript', 50);
    const topLine = f.split('\n').find((l) => l.includes('┌'))!;
    const bottomLine = f.split('\n').find((l) => l.includes('└'))!;
    expect(len(topLine)).toBe(len(bottomLine));
  });

  // ── code content ───────────────────────────────────────────────────────────

  it('renders single-line code content', () => {
    expect(frame('console.log("hi")')).toContain('console.log("hi")');
  });

  it('renders multi-line code content', () => {
    const f = frame('function hello() {\n  return "world";\n}');
    expect(f).toContain('function hello()');
    expect(f).toContain('return "world"');
    expect(f).toContain('}');
  });

  it('each line of multi-line code has its own │ prefix', () => {
    const f = frame('a\nb\nc');
    const prefixedLines = f.split('\n').filter((l) => l.match(/│ [a-c]/));
    expect(prefixedLines).toHaveLength(3);
  });

  it('renders empty code block without crashing', () => {
    expect(() => frame('')).not.toThrow();
  });

  it('empty code block still has borders', () => {
    const f = frame('');
    expect(f).toContain('┌');
    expect(f).toContain('└');
  });

  it('code content preserves indentation', () => {
    const f = frame('  indented\n    double');
    expect(f).toContain('  indented');
    expect(f).toContain('    double');
  });

  // ── block spacing ──────────────────────────────────────────────────────────

  it('has a trailing newline (marginBottom)', () => {
    const f = frame('x');
    expect(f).toMatch(/\n$/);
  });

  // ── border width consistency across widths ─────────────────────────────────

  it('top and bottom borders are equal at narrow width', () => {
    const f = frame('hi', null, 20);
    const top = f.split('\n').find((l) => l.includes('┌'))!;
    const bot = f.split('\n').find((l) => l.includes('└'))!;
    expect(len(top)).toBe(len(bot));
  });

  it('top and bottom borders are equal at wide width', () => {
    const f = frame('hi', 'rust', 120);
    const top = f.split('\n').find((l) => l.includes('┌'))!;
    const bot = f.split('\n').find((l) => l.includes('└'))!;
    expect(len(top)).toBe(len(bot));
  });
});
