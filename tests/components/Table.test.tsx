import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Table } from '../../src/components/nodes/Table.js';
import type { Table as MdastTable, TableRow, TableCell } from 'mdast';

function makeTable(headers: string[], rows: string[][]): MdastTable {
  function makeCell(text: string): TableCell {
    return {
      type: 'tableCell',
      children: [{ type: 'text', value: text }],
    };
  }

  function makeRow(cells: string[]): TableRow {
    return {
      type: 'tableRow',
      children: cells.map(makeCell),
    };
  }

  return {
    type: 'table',
    align: headers.map(() => null),
    children: [makeRow(headers), ...rows.map(makeRow)],
  };
}

describe('Table component', () => {
  it('renders header cells', () => {
    const { lastFrame } = render(<Table node={makeTable(['Name', 'Age'], [])} />);
    expect(lastFrame()).toContain('Name');
    expect(lastFrame()).toContain('Age');
  });

  it('renders body rows', () => {
    const { lastFrame } = render(
      <Table node={makeTable(['Name', 'Age'], [['Alice', '30'], ['Bob', '25']])} />,
    );
    expect(lastFrame()).toContain('Alice');
    expect(lastFrame()).toContain('Bob');
    expect(lastFrame()).toContain('30');
    expect(lastFrame()).toContain('25');
  });

  it('renders separator row', () => {
    const { lastFrame } = render(<Table node={makeTable(['Col'], [['val']])} />);
    expect(lastFrame()).toContain('─');
  });

  it('renders column separators │', () => {
    const { lastFrame } = render(
      <Table node={makeTable(['A', 'B'], [['1', '2']])} />,
    );
    expect(lastFrame()).toContain('│');
  });

  it('returns null for empty table', () => {
    const emptyTable: MdastTable = {
      type: 'table',
      align: [],
      children: [],
    };
    const { lastFrame } = render(<Table node={emptyTable} />);
    // Should render nothing or empty
    expect(lastFrame()).toBe('');
  });
});
