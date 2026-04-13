import React from 'react';
import { Box } from 'ink';
import type { Paragraph as MdastParagraph } from 'mdast';
import type { PhrasingContent } from 'mdast';
import { InlineContent } from './InlineContent.js';

type ParagraphProps = {
  node: MdastParagraph;
};

export function Paragraph({ node }: ParagraphProps) {
  const children = node.children as PhrasingContent[];
  return (
    <Box marginBottom={1}>
      <InlineContent children={children} />
    </Box>
  );
}
