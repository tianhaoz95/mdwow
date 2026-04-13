import React from 'react';
import { Box, Text } from 'ink';
import type { Blockquote as MdastBlockquote, Paragraph, PhrasingContent, Code } from 'mdast';
import { theme } from '../../theme.js';
import { InlineContent } from './InlineContent.js';

type BlockquoteProps = {
  node: MdastBlockquote;
};

function BlockquoteLine({ children }: { children: React.ReactNode }) {
  return (
    <Box flexDirection="row">
      <Text {...theme.blockquoteBorder}>{'│ '}</Text>
      <Box flexShrink={1}>{children}</Box>
    </Box>
  );
}

export function Blockquote({ node }: BlockquoteProps) {
  return (
    <Box flexDirection="column" marginBottom={1} marginLeft={1}>
      {node.children.map((child, i) => {
        if (child.type === 'paragraph') {
          const para = child as Paragraph;
          const children = para.children as PhrasingContent[];
          return (
            <BlockquoteLine key={i}>
              <InlineContent children={children} style={theme.blockquote} />
            </BlockquoteLine>
          );
        }

        if (child.type === 'code') {
          const code = child as Code;
          return (
            <BlockquoteLine key={i}>
              <Text {...theme.blockquote}>{code.value}</Text>
            </BlockquoteLine>
          );
        }

        // Nested blockquote — recurse
        if (child.type === 'blockquote') {
          return (
            <BlockquoteLine key={i}>
              <Blockquote node={child as MdastBlockquote} />
            </BlockquoteLine>
          );
        }

        return null;
      })}
    </Box>
  );
}
