import React from 'react';
import { Box, Text } from 'ink';
import type {
  List as MdastList,
  ListItem,
  Paragraph,
  PhrasingContent,
  BlockContent,
} from 'mdast';
import { theme } from '../../theme.js';
import { InlineContent } from './InlineContent.js';

type ListProps = {
  node: MdastList;
  depth?: number;
};

function renderListItemContent(
  item: ListItem,
  ordered: boolean,
  index: number,
  depth: number,
): React.ReactNode {
  const indent = '  '.repeat(depth);
  const bullet = ordered
    ? `${index + 1}.`
    : '•';

  const bulletStyle = ordered ? theme.orderedListNumber : theme.listBullet;

  return (
    <Box key={index} flexDirection="column">
      {item.children.map((child, ci) => {
        if (child.type === 'paragraph') {
          const para = child as Paragraph;
          const pChildren = para.children as PhrasingContent[];
          return (
            <Box key={ci} flexDirection="row">
              <Text>{indent}</Text>
              <Text {...bulletStyle}>{`${bullet} `}</Text>
              <Box flexShrink={1}>
                <InlineContent children={pChildren} />
              </Box>
            </Box>
          );
        }

        if (child.type === 'list') {
          return (
            <Box key={ci} marginLeft={2 + indent.length}>
              <List node={child as MdastList} depth={depth + 1} />
            </Box>
          );
        }

        return null;
      })}
    </Box>
  );
}

export function List({ node, depth = 0 }: ListProps) {
  const ordered = node.ordered ?? false;

  return (
    <Box flexDirection="column" marginBottom={depth === 0 ? 1 : 0}>
      {node.children.map((item, i) =>
        renderListItemContent(item as ListItem, ordered, i, depth),
      )}
    </Box>
  );
}
