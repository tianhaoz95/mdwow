import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { List } from '../../src/components/nodes/List.js';
import type { List as MdastList, ListItem } from 'mdast';

function makeList(items: string[], ordered = false): MdastList {
  return {
    type: 'list', ordered, spread: false,
    children: items.map((text): ListItem => ({
      type: 'listItem', spread: false,
      children: [{ type: 'paragraph', children: [{ type: 'text', value: text }] }],
    })),
  };
}

function frame(node: MdastList) {
  return render(<List node={node} />).lastFrame() ?? '';
}

describe('List visual output', () => {
  // ── unordered bullets ──────────────────────────────────────────────────────

  it('renders • bullet for each unordered item', () => {
    const f = frame(makeList(['Alpha', 'Beta', 'Gamma']));
    const bullets = f.split('\n').filter((l) => l.includes('•'));
    expect(bullets).toHaveLength(3);
  });

  it('bullet • precedes item text', () => {
    const f = frame(makeList(['Alpha']));
    expect(f).toContain('• Alpha');
  });

  it('renders all unordered item texts', () => {
    const f = frame(makeList(['Alpha', 'Beta', 'Gamma']));
    expect(f).toContain('Alpha');
    expect(f).toContain('Beta');
    expect(f).toContain('Gamma');
  });

  it('items appear in order', () => {
    const f = frame(makeList(['First', 'Second', 'Third']));
    expect(f.indexOf('First')).toBeLessThan(f.indexOf('Second'));
    expect(f.indexOf('Second')).toBeLessThan(f.indexOf('Third'));
  });

  // ── ordered numbers ────────────────────────────────────────────────────────

  it('renders 1. for first ordered item', () => {
    expect(frame(makeList(['One'], true))).toContain('1.');
  });

  it('renders sequential numbers for ordered list', () => {
    const f = frame(makeList(['One', 'Two', 'Three'], true));
    expect(f).toContain('1.');
    expect(f).toContain('2.');
    expect(f).toContain('3.');
  });

  it('number precedes item text', () => {
    const f = frame(makeList(['First'], true));
    expect(f).toContain('1. First');
  });

  it('does not render • for ordered list', () => {
    expect(frame(makeList(['a', 'b'], true))).not.toContain('•');
  });

  it('does not render numbers for unordered list', () => {
    const f = frame(makeList(['a', 'b'], false));
    expect(f).not.toMatch(/\d\./);
  });

  // ── inline formatting in list items ────────────────────────────────────────

  it('renders bold text inside list item', () => {
    const node: MdastList = {
      type: 'list', ordered: false, spread: false,
      children: [{
        type: 'listItem', spread: false,
        children: [{
          type: 'paragraph',
          children: [{ type: 'strong', children: [{ type: 'text', value: 'bold item' }] }],
        }],
      }],
    };
    expect(frame(node)).toContain('bold item');
  });

  it('renders inline code inside list item', () => {
    const node: MdastList = {
      type: 'list', ordered: false, spread: false,
      children: [{
        type: 'listItem', spread: false,
        children: [{
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Run ' },
            { type: 'inlineCode', value: 'npm test' },
          ],
        }],
      }],
    };
    const f = frame(node);
    expect(f).toContain('Run');
    expect(f).toContain('npm test');
  });

  // ── nested lists ───────────────────────────────────────────────────────────

  it('renders nested list items', () => {
    const nested: MdastList = {
      type: 'list', ordered: false, spread: false,
      children: [{
        type: 'listItem', spread: false,
        children: [
          { type: 'paragraph', children: [{ type: 'text', value: 'Parent' }] },
          makeList(['Child A', 'Child B']),
        ],
      }],
    };
    const f = frame(nested);
    expect(f).toContain('Parent');
    expect(f).toContain('Child A');
    expect(f).toContain('Child B');
  });

  it('nested items have greater indentation than parent', () => {
    const nested: MdastList = {
      type: 'list', ordered: false, spread: false,
      children: [{
        type: 'listItem', spread: false,
        children: [
          { type: 'paragraph', children: [{ type: 'text', value: 'Parent' }] },
          makeList(['Child']),
        ],
      }],
    };
    const f = frame(nested);
    const parentLine = f.split('\n').find((l) => l.includes('Parent'))!;
    const childLine = f.split('\n').find((l) => l.includes('Child'))!;
    const parentIndent = parentLine.match(/^(\s*)/)?.[1]?.length ?? 0;
    const childIndent = childLine.match(/^(\s*)/)?.[1]?.length ?? 0;
    expect(childIndent).toBeGreaterThan(parentIndent);
  });

  // ── spacing ────────────────────────────────────────────────────────────────

  it('top-level list has trailing newline (marginBottom)', () => {
    expect(frame(makeList(['x']))).toMatch(/\n$/);
  });

  it('single item list renders correctly', () => {
    const f = frame(makeList(['Only item']));
    expect(f).toContain('• Only item');
  });
});
