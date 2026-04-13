import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Heading } from '../../src/components/nodes/Heading.js';
import type { Heading as MdastHeading } from 'mdast';

function makeHeading(depth: 1 | 2 | 3 | 4 | 5 | 6, text: string): MdastHeading {
  return {
    type: 'heading',
    depth,
    children: [{ type: 'text', value: text }],
  };
}

describe('Heading component', () => {
  it('renders H1 text', () => {
    const { lastFrame } = render(<Heading node={makeHeading(1, 'My Title')} />);
    expect(lastFrame()).toContain('My Title');
  });

  it('renders H1 with decorators', () => {
    const { lastFrame } = render(<Heading node={makeHeading(1, 'Hello')} />);
    expect(lastFrame()).toContain('═');
  });

  it('renders H2 text', () => {
    const { lastFrame } = render(<Heading node={makeHeading(2, 'Section')} />);
    expect(lastFrame()).toContain('Section');
  });

  it('renders H2 with partial decorators', () => {
    const { lastFrame } = render(<Heading node={makeHeading(2, 'Section')} />);
    expect(lastFrame()).toContain('──');
  });

  it('renders H3 text with arrow prefix', () => {
    const { lastFrame } = render(<Heading node={makeHeading(3, 'Subsection')} />);
    expect(lastFrame()).toContain('Subsection');
    expect(lastFrame()).toContain('▸');
  });

  it('renders H4 with hash prefix', () => {
    const { lastFrame } = render(<Heading node={makeHeading(4, 'Detail')} />);
    expect(lastFrame()).toContain('####');
    expect(lastFrame()).toContain('Detail');
  });

  it('renders H5 with hash prefix', () => {
    const { lastFrame } = render(<Heading node={makeHeading(5, 'Minor')} />);
    expect(lastFrame()).toContain('#####');
    expect(lastFrame()).toContain('Minor');
  });

  it('renders H6 with hash prefix', () => {
    const { lastFrame } = render(<Heading node={makeHeading(6, 'Tiny')} />);
    expect(lastFrame()).toContain('######');
    expect(lastFrame()).toContain('Tiny');
  });
});
