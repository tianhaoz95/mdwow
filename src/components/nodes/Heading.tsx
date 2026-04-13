import React from 'react';
import { Box, Text } from 'ink';
import type { Heading as MdastHeading, PhrasingContent } from 'mdast';
import { theme } from '../../theme.js';
import { InlineContent } from './InlineContent.js';

type HeadingProps = {
  node: MdastHeading;
  terminalWidth?: number;
};

export function Heading({ node, terminalWidth = 80 }: HeadingProps) {
  const { depth } = node;
  const children = node.children as PhrasingContent[];

  if (depth === 1) {
    const maxWidth = Math.min(terminalWidth - 2, 78);
    const bar = '═'.repeat(Math.max(4, maxWidth));
    return (
      <Box flexDirection="column" marginY={1}>
        <Text {...theme.h1}>{bar}</Text>
        <Box flexDirection="row">
          <Text {...theme.h1}>{'  '}</Text>
          <InlineContent children={children} style={theme.h1} />
        </Box>
        <Text {...theme.h1}>{bar}</Text>
      </Box>
    );
  }

  if (depth === 2) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <InlineContent children={children} style={theme.h2} />
        <Text {...theme.h2} dimColor>{'─'.repeat(40)}</Text>
      </Box>
    );
  }

  if (depth === 3) {
    return (
      <Box flexDirection="row" marginTop={1}>
        <Text {...theme.h3}>{'▸ '}</Text>
        <InlineContent children={children} style={theme.h3} />
      </Box>
    );
  }

  if (depth === 4) {
    return (
      <Box marginTop={1}>
        <InlineContent children={children} style={theme.h4} />
      </Box>
    );
  }

  if (depth === 5) {
    return (
      <Box marginTop={1}>
        <InlineContent children={children} style={theme.h5} />
      </Box>
    );
  }

  return (
    <Box marginTop={1}>
      <InlineContent children={children} style={theme.h6} />
    </Box>
  );
}
