import React from 'react';
import { Text } from 'ink';
import type {
  PhrasingContent,
  Text as MdastText,
  Strong,
  Emphasis,
  InlineCode,
  Link,
  Image,
  Delete,
  Html,
} from 'mdast';
import { theme } from '../../theme.js';

type InlineNode = PhrasingContent;

/**
 * Recursively extract the plain text value of an inline node tree.
 * Used so that styled wrapper <Text> nodes can hold a plain string child
 * rather than nesting another <Text>, which would override the parent's styles.
 */
function extractText(node: InlineNode): string {
  if (node.type === 'text') return (node as MdastText).value;
  if (node.type === 'inlineCode') return ` ${(node as InlineCode).value} `;
  if (node.type === 'break') return '\n';
  if (node.type === 'html') return (node as Html).value;
  if (node.type === 'image') {
    const img = node as Image;
    return `[image: ${img.alt || img.url}]`;
  }
  if ('children' in node) {
    return (node as { children: InlineNode[] }).children.map(extractText).join('');
  }
  if ('value' in node) return (node as { value: string }).value;
  return '';
}

function renderInlineNode(node: InlineNode, key: string | number): React.ReactNode {
  switch (node.type) {
    case 'text': {
      // Plain text: return a raw string so parent <Text> styles are not overridden
      return (node as MdastText).value;
    }

    case 'strong': {
      const strongNode = node as Strong;
      return (
        <Text key={key} {...theme.bold}>
          {strongNode.children.map(extractText).join('')}
        </Text>
      );
    }

    case 'emphasis': {
      const emNode = node as Emphasis;
      return (
        <Text key={key} {...theme.italic}>
          {emNode.children.map(extractText).join('')}
        </Text>
      );
    }

    case 'delete': {
      const delNode = node as Delete;
      return (
        <Text key={key} {...theme.strikethrough}>
          {delNode.children.map(extractText).join('')}
        </Text>
      );
    }

    case 'inlineCode': {
      const codeNode = node as InlineCode;
      return (
        <Text key={key} {...theme.inlineCode}>
          {` ${codeNode.value} `}
        </Text>
      );
    }

    case 'link': {
      const linkNode = node as Link;
      const label = linkNode.children.length > 0
        ? linkNode.children.map(extractText).join('')
        : linkNode.url;
      return (
        <Text key={key} {...theme.link}>
          {label}
        </Text>
      );
    }

    case 'image': {
      const imgNode = node as Image;
      return (
        <Text key={key} {...theme.image}>
          {`[image: ${imgNode.alt || imgNode.url}]`}
        </Text>
      );
    }

    case 'break': {
      return '\n';
    }

    case 'html': {
      const htmlNode = node as Html;
      return (
        <Text key={key} {...theme.html}>
          {htmlNode.value}
        </Text>
      );
    }

    default: {
      const anyNode = node as unknown as { value?: string; children?: InlineNode[] };
      if (anyNode.value) return anyNode.value;
      if (anyNode.children) return anyNode.children.map(extractText).join('');
      return null;
    }
  }
}

type InlineContentProps = {
  children: InlineNode[];
  style?: React.ComponentProps<typeof Text>;
};

export function InlineContent({ children, style }: InlineContentProps) {
  return (
    <Text wrap="wrap" {...style}>
      {children.map((child, i) => renderInlineNode(child, i))}
    </Text>
  );
}
