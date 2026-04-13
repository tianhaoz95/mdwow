import React from 'react';
import { Box, Text } from 'ink';
import type { Root, Content } from 'mdast';
import { Heading } from './nodes/Heading.js';
import { Paragraph } from './nodes/Paragraph.js';
import { CodeBlock } from './nodes/CodeBlock.js';
import { Blockquote } from './nodes/Blockquote.js';
import { List } from './nodes/List.js';
import { Table } from './nodes/Table.js';
import { HorizontalRule } from './nodes/HorizontalRule.js';
import { theme } from '../theme.js';
import type {
  Heading as MdastHeading,
  Paragraph as MdastParagraph,
  Code,
  Blockquote as MdastBlockquote,
  List as MdastList,
  Table as MdastTable,
} from 'mdast';

type MarkdownRendererProps = {
  ast: Root;
  terminalWidth?: number;
};

function renderNode(node: Content, index: number, terminalWidth: number): React.ReactNode {
  switch (node.type) {
    case 'heading':
      return (
        <Heading
          key={index}
          node={node as MdastHeading}
          terminalWidth={terminalWidth}
        />
      );

    case 'paragraph':
      return <Paragraph key={index} node={node as MdastParagraph} />;

    case 'code':
      return (
        <CodeBlock
          key={index}
          node={node as Code}
          terminalWidth={terminalWidth}
        />
      );

    case 'blockquote':
      return <Blockquote key={index} node={node as MdastBlockquote} />;

    case 'list':
      return <List key={index} node={node as MdastList} />;

    case 'table':
      return <Table key={index} node={node as MdastTable} />;

    case 'thematicBreak':
      return <HorizontalRule key={index} terminalWidth={terminalWidth} />;

    case 'html': {
      const htmlNode = node as { type: 'html'; value: string };
      return (
        <Box key={index} marginBottom={1}>
          <Text {...theme.html}>{htmlNode.value}</Text>
        </Box>
      );
    }

    default: {
      // Unknown node type — show dim fallback
      const anyNode = node as unknown as { type: string; value?: string };
      return (
        <Box key={index} marginBottom={1}>
          <Text dimColor>{`[${anyNode.type}]${anyNode.value ? ': ' + anyNode.value : ''}`}</Text>
        </Box>
      );
    }
  }
}

export function MarkdownRenderer({ ast, terminalWidth = 80 }: MarkdownRendererProps) {
  return (
    <Box flexDirection="column" paddingX={2}>
      {ast.children.map((node, i) => renderNode(node as Content, i, terminalWidth))}
    </Box>
  );
}
