import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { List } from '../../src/components/nodes/List.js';
import type { List as MdastList, ListItem } from 'mdast';

function makeList(items: string[], ordered = false): MdastList {
  return {
    type: 'list',
    ordered,
    spread: false,
    children: items.map(
      (text): ListItem => ({
        type: 'listItem',
        spread: false,
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: text }],
          },
        ],
      }),
    ),
  };
}

describe('List component', () => {
  it('renders unordered list items', () => {
    const { lastFrame } = render(<List node={makeList(['Alpha', 'Beta', 'Gamma'])} />);
    expect(lastFrame()).toContain('Alpha');
    expect(lastFrame()).toContain('Beta');
    expect(lastFrame()).toContain('Gamma');
  });

  it('renders bullet character • for unordered list', () => {
    const { lastFrame } = render(<List node={makeList(['Item'])} />);
    expect(lastFrame()).toContain('•');
  });

  it('renders numbers for ordered list', () => {
    const { lastFrame } = render(<List node={makeList(['One', 'Two', 'Three'], true)} />);
    expect(lastFrame()).toContain('1.');
    expect(lastFrame()).toContain('2.');
    expect(lastFrame()).toContain('3.');
  });

  it('renders ordered list items text', () => {
    const { lastFrame } = render(<List node={makeList(['One', 'Two', 'Three'], true)} />);
    expect(lastFrame()).toContain('One');
    expect(lastFrame()).toContain('Two');
    expect(lastFrame()).toContain('Three');
  });

  it('renders nested list', () => {
    const nested: MdastList = {
      type: 'list',
      ordered: false,
      spread: false,
      children: [
        {
          type: 'listItem',
          spread: false,
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'Parent' }],
            },
            makeList(['Child 1', 'Child 2']),
          ],
        },
      ],
    };
    const { lastFrame } = render(<List node={nested} />);
    expect(lastFrame()).toContain('Parent');
    expect(lastFrame()).toContain('Child 1');
    expect(lastFrame()).toContain('Child 2');
  });
});
