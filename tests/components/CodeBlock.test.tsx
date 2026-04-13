import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { CodeBlock } from '../../src/components/nodes/CodeBlock.js';
import type { Code } from 'mdast';

function makeCode(value: string, lang?: string): Code {
  return {
    type: 'code',
    value,
    lang: lang ?? null,
    meta: null,
  };
}

describe('CodeBlock component', () => {
  it('renders the code content', () => {
    const { lastFrame } = render(<CodeBlock node={makeCode('const x = 1;')} />);
    expect(lastFrame()).toContain('const x = 1;');
  });

  it('renders top border with ┌', () => {
    const { lastFrame } = render(<CodeBlock node={makeCode('hello')} />);
    expect(lastFrame()).toContain('┌');
  });

  it('renders bottom border with └', () => {
    const { lastFrame } = render(<CodeBlock node={makeCode('hello')} />);
    expect(lastFrame()).toContain('└');
  });

  it('renders side border │ for each line', () => {
    const { lastFrame } = render(<CodeBlock node={makeCode('line1\nline2')} />);
    expect(lastFrame()).toContain('│');
  });

  it('renders language label in top border', () => {
    const { lastFrame } = render(<CodeBlock node={makeCode('x = 1', 'python')} />);
    expect(lastFrame()).toContain('python');
  });

  it('renders multi-line code correctly', () => {
    const code = 'function hello() {\n  return "world";\n}';
    const { lastFrame } = render(<CodeBlock node={makeCode(code)} />);
    expect(lastFrame()).toContain('function hello()');
    expect(lastFrame()).toContain('return "world"');
  });

  it('renders without language label when lang is null', () => {
    const { lastFrame } = render(<CodeBlock node={makeCode('hello')} />);
    // Should still have borders
    expect(lastFrame()).toContain('┌');
    expect(lastFrame()).toContain('└');
  });
});
