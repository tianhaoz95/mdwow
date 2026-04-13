import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../theme.js';

type HorizontalRuleProps = {
  terminalWidth?: number;
};

export function HorizontalRule({ terminalWidth = 80 }: HorizontalRuleProps) {
  const width = Math.min(terminalWidth - 4, 76);
  return (
    <Box marginBottom={1}>
      <Text {...theme.hr}>{'─'.repeat(width)}</Text>
    </Box>
  );
}
