import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Table } from '../../src/components/nodes/Table.js';
import type { Table as MdastTable, TableRow, TableCell } from 'mdast';

function makeCell(text: string): TableCell {
  return { type: 'tableCell', children: [{ type: 'text', value: text }] };
}
function makeRow(...cells: string[]): TableRow {
  return { type: 'tableRow', children: cells.map(makeCell) };
}
function makeTable(headers: string[], ...bodyRows: string[][]): MdastTable {
  return {
    type: 'table',
    align: headers.map(() => null),
    children: [makeRow(...headers), ...bodyRows.map((r) => makeRow(...r))],
  };
}

function frame(node: MdastTable) {
  return render(<Table node={node} />).lastFrame() ?? '';
}

describe('Table visual output', () => {
  // ── column separators ──────────────────────────────────────────────────────

  it('renders │ separators between columns', () => {
    const f = frame(makeTable(['A', 'B'], ['1', '2']));
    expect(f).toContain('│');
  });

  it('header row starts with │', () => {
    const f = frame(makeTable(['Name', 'Age'], ['Alice', '30']));
    const headerLine = f.split('\n')[0]!;
    expect(headerLine).toMatch(/^│/);
  });

  it('body row starts with │', () => {
    const f = frame(makeTable(['Name', 'Age'], ['Alice', '30']));
    // Third line (index 2) is first body row
    const bodyLine = f.split('\n')[2]!;
    expect(bodyLine).toMatch(/^│/);
  });

  // ── separator row ──────────────────────────────────────────────────────────

  it('renders ├ at start of separator row', () => {
    expect(frame(makeTable(['A'], ['1']))).toContain('├');
  });

  it('renders ┤ at end of separator row', () => {
    expect(frame(makeTable(['A'], ['1']))).toContain('┤');
  });

  it('renders ┼ between columns in separator row', () => {
    expect(frame(makeTable(['A', 'B'], ['1', '2']))).toContain('┼');
  });

  it('separator row contains only ├ ─ ┼ ┤ characters', () => {
    const f = frame(makeTable(['Name', 'Age'], ['Alice', '30']));
    const sepLine = f.split('\n').find((l) => l.includes('├'))!;
    expect(sepLine).toMatch(/^[├─┼┤]+$/);
  });

  it('separator row has same length as header row', () => {
    const f = frame(makeTable(['Name', 'Age'], ['Alice', '30']));
    const lines = f.split('\n').filter((l) => l.trim().length > 0);
    const headerLine = lines[0]!;
    const sepLine = lines[1]!;
    expect(sepLine.length).toBe(headerLine.length);
  });

  it('body rows have same length as header row', () => {
    const f = frame(makeTable(['Name', 'Age'], ['Alice', '30'], ['Bob', '25']));
    const lines = f.split('\n').filter((l) => l.trim().length > 0);
    const headerLen = lines[0]!.length;
    // All data rows (skip separator)
    const dataRows = [lines[0]!, ...lines.slice(2)];
    dataRows.forEach((row) => {
      expect(row.length).toBe(headerLen);
    });
  });

  // ── cell content ───────────────────────────────────────────────────────────

  it('renders header cell text', () => {
    const f = frame(makeTable(['Name', 'Score']));
    expect(f).toContain('Name');
    expect(f).toContain('Score');
  });

  it('renders body cell text', () => {
    const f = frame(makeTable(['Name', 'Score'], ['Alice', '100'], ['Bob', '95']));
    expect(f).toContain('Alice');
    expect(f).toContain('Bob');
    expect(f).toContain('100');
    expect(f).toContain('95');
  });

  it('cells are padded to equal column width', () => {
    // "Name" (4) and "Alice" (5) → col width 5
    // Both cells in col 0 should be padded to 5
    const f = frame(makeTable(['Name', 'X'], ['Alice', 'Y']));
    const headerLine = f.split('\n')[0]!;
    const bodyLine = f.split('\n')[2]!;
    // Extract first cell content (between first │ and second │)
    const headerCell = headerLine.split('│')[1]!;
    const bodyCell = bodyLine.split('│')[1]!;
    expect(headerCell.length).toBe(bodyCell.length);
  });

  it('single-column table renders correctly', () => {
    const f = frame(makeTable(['Only'], ['value']));
    expect(f).toContain('Only');
    expect(f).toContain('value');
    expect(f).toContain('│');
    expect(f).toContain('├');
  });

  it('three-column table has two ┼ in separator', () => {
    const f = frame(makeTable(['A', 'B', 'C'], ['1', '2', '3']));
    const sepLine = f.split('\n').find((l) => l.includes('├'))!;
    const crossCount = (sepLine.match(/┼/g) ?? []).length;
    expect(crossCount).toBe(2);
  });

  // ── empty table ────────────────────────────────────────────────────────────

  it('returns empty string for table with no rows', () => {
    const empty: MdastTable = { type: 'table', align: [], children: [] };
    expect(frame(empty)).toBe('');
  });

  // ── spacing ────────────────────────────────────────────────────────────────

  it('has trailing newline (marginBottom)', () => {
    expect(frame(makeTable(['A'], ['1']))).toMatch(/\n$/);
  });

  // ── exact structure for known input ────────────────────────────────────────

  it('renders exact structure for 2-column table', () => {
    const f = frame(makeTable(['Name', 'Age'], ['Alice', '30']));
    const lines = f.split('\n').filter((l) => l.trim().length > 0);
    // Line 0: header — Name col width=5 (Alice), Age col width=3 (Age)
    expect(lines[0]).toMatch(/^│ Name\s* │ Age\s* │$/);
    // Line 1: separator
    expect(lines[1]).toMatch(/^├─+┼─+┤$/);
    // Line 2: body row
    expect(lines[2]).toMatch(/^│ Alice\s* │ 30\s* │$/);
  });
});
