import React from 'react';
import { Box, Text } from 'ink';
import type { Code } from 'mdast';
import { theme } from '../../theme.js';

type CodeBlockProps = {
  node: Code;
  terminalWidth?: number;
};

export function CodeBlock({ node, terminalWidth = 80 }: CodeBlockProps) {
  const { lang, value } = node;
  // Inner content width (between the corner chars ┌ and ┐)
  const innerWidth = Math.min(terminalWidth - 4, 74);
  const lines = value.split('\n');

  // Top border: ┌─── lang ───┐  (total chars = 1 + innerWidth + 1)
  const langLabel = lang ? ` ${lang} ` : '';
  const topFill = '─'.repeat(Math.max(0, innerWidth - langLabel.length));
  const topBorder = `┌${topFill}${langLabel}┐`;

  // Bottom border: └────────────┘  (same total width as top)
  const bottomBorder = `└${'─'.repeat(innerWidth)}┘`;

  return (
    <Box flexDirection="column" marginBottom={1} marginLeft={1}>
      <Text {...theme.codeBlockBorder}>{topBorder}</Text>
      {lines.map((line, i) => (
        <Box key={i}>
          <Text {...theme.codeBlockBorder}>{'│ '}</Text>
          <Text {...theme.codeBlock}>{line}</Text>
        </Box>
      ))}
      <Text {...theme.codeBlockBorder}>{bottomBorder}</Text>
    </Box>
  );
}
