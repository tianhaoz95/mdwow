import React from 'react';
import { Box, Text } from 'ink';
import type { Table as MdastTable, TableRow, TableCell, PhrasingContent } from 'mdast';
import { theme } from '../../theme.js';

type TableProps = {
  node: MdastTable;
};

function getCellText(cell: TableCell): string {
  function extractText(nodes: PhrasingContent[]): string {
    return nodes
      .map((n) => {
        if (n.type === 'text') return (n as { value: string }).value;
        if ('children' in n) return extractText((n as { children: PhrasingContent[] }).children);
        if ('value' in n) return (n as { value: string }).value;
        return '';
      })
      .join('');
  }
  return extractText(cell.children as PhrasingContent[]);
}

export function Table({ node }: TableProps) {
  const rows = node.children as TableRow[];
  if (rows.length === 0) return null;

  // Calculate column widths (minimum 3)
  const colWidths: number[] = [];
  rows.forEach((row) => {
    (row.children as TableCell[]).forEach((cell, ci) => {
      const text = getCellText(cell);
      colWidths[ci] = Math.max(colWidths[ci] ?? 0, text.length, 3);
    });
  });

  const pad = (str: string, width: number) => str + ' '.repeat(Math.max(0, width - str.length));

  const headerRow = rows[0]!;
  const bodyRows = rows.slice(1);

  // Row format:  │ cell │ cell │
  // Each cell slot is: ' ' + padded(w) + ' │'
  // Separator:   ├─────┼─────┤
  // Each col slot in separator: '─'.repeat(w+2) (the space on each side)
  const separatorCols = colWidths.map((w) => '─'.repeat(w + 2));
  const separatorRow = '├' + separatorCols.join('┼') + '┤';

  function renderRow(cells: TableCell[], isHeader: boolean) {
    const cellStyle = isHeader ? theme.tableHeader : theme.tableCell;
    return (
      <Box flexDirection="row">
        <Text {...theme.tableSeparator}>{'│'}</Text>
        {cells.map((cell, ci) => (
          <React.Fragment key={ci}>
            <Text {...cellStyle}>{' ' + pad(getCellText(cell), colWidths[ci] ?? 0) + ' '}</Text>
            <Text {...theme.tableSeparator}>{'│'}</Text>
          </React.Fragment>
        ))}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      {renderRow(headerRow.children as TableCell[], true)}
      <Text {...theme.tableSeparator}>{separatorRow}</Text>
      {bodyRows.map((row, ri) => (
        <Box key={ri}>
          {renderRow(row.children as TableCell[], false)}
        </Box>
      ))}
    </Box>
  );
}
