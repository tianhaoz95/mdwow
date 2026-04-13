/**
 * Pure string renderer: Markdown AST → array of ANSI-colored strings (one per line).
 * No React/Ink involved. This makes scrolling instant — we just slice the array.
 */

// cli-highlight uses chalk internally and checks chalk.level for color support.
// Set FORCE_COLOR before any imports so its chalk instance picks it up.
process.env.FORCE_COLOR = '3';

import chalk from 'chalk';
import { highlight as cliHighlight, supportsLanguage } from 'cli-highlight';
import { renderMermaidASCII } from 'beautiful-mermaid';
import type {
  Root,
  Content,
  PhrasingContent,
  Heading,
  Paragraph,
  Code,
  Blockquote,
  List,
  ListItem,
  Table,
  TableRow,
  TableCell,
  Text as MdastText,
  Strong,
  Emphasis,
  InlineCode,
  Link,
  Image,
  Delete,
  Html,
} from 'mdast';

// Force colors even when stdout is not a TTY (e.g. piped)
chalk.level = 3;

// ── inline rendering ──────────────────────────────────────────────────────────

function renderInline(node: PhrasingContent): string {
  switch (node.type) {
    case 'text':
      return (node as MdastText).value;
    case 'strong':
      return chalk.bold.whiteBright((node as Strong).children.map(renderInline).join(''));
    case 'emphasis':
      return chalk.italic((node as Emphasis).children.map(renderInline).join(''));
    case 'delete':
      return chalk.dim((node as Delete).children.map(renderInline).join(''));
    case 'inlineCode':
      return chalk.bgGray.yellowBright(` ${(node as InlineCode).value} `);
    case 'link': {
      const n = node as Link;
      const label = n.children.length > 0 ? n.children.map(renderInline).join('') : n.url;
      return chalk.blueBright.underline(label);
    }
    case 'image': {
      const n = node as Image;
      return chalk.blue.dim(`[image: ${n.alt || n.url}]`);
    }
    case 'break':
      return '\n';
    case 'html':
      return chalk.dim((node as Html).value);
    default: {
      const any = node as unknown as { value?: string; children?: PhrasingContent[] };
      if (any.children) return any.children.map(renderInline).join('');
      if (any.value) return any.value;
      return '';
    }
  }
}

function renderInlines(nodes: PhrasingContent[]): string {
  return nodes.map(renderInline).join('');
}

// ── word-wrap ─────────────────────────────────────────────────────────────────

function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function visibleLength(s: string): number {
  return stripAnsi(s).length;
}

/**
 * Wrap a pre-rendered ANSI string to fit within `width` visible characters.
 * Splits on whitespace boundaries; preserves ANSI codes.
 */
function wrapLine(line: string, width: number): string[] {
  if (visibleLength(line) <= width) return [line];

  const words = line.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (visibleLength(test) <= width) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [line];
}

// ── block rendering ───────────────────────────────────────────────────────────

function renderHeading(node: Heading, width: number): string[] {
  const text = renderInlines(node.children as PhrasingContent[]);
  const { depth } = node;

  if (depth === 1) {
    const bar = chalk.magentaBright('═'.repeat(width));
    return ['', bar, chalk.bold.magentaBright('  ' + text), bar, ''];
  }

  if (depth === 2) {
    return [
      '',
      chalk.bold.cyanBright(text),
      chalk.cyanBright.dim('─'.repeat(width)),
    ];
  }

  if (depth === 3) {
    return ['', chalk.bold.yellowBright('▸ ' + text)];
  }

  if (depth === 4) {
    return ['', chalk.bold.greenBright(text)];
  }

  if (depth === 5) {
    return ['', chalk.blueBright(text)];
  }

  // H6
  return ['', chalk.white.dim(text)];
}

function renderParagraph(node: Paragraph, width: number): string[] {
  const text = renderInlines(node.children as PhrasingContent[]);
  return [...wrapLine(text, width), ''];
}

function renderCode(node: Code, width: number): string[] {
  const lang = node.lang?.toLowerCase() ?? '';

  // ── Mermaid: render as ASCII diagram ──────────────────────────────────────
  if (lang === 'mermaid') {
    return renderMermaidBlock(node.value, width);
  }

  // ── Regular code block with syntax highlighting ───────────────────────────
  const innerWidth = Math.max(10, width - 2);
  const langLabel = node.lang ? ` ${node.lang} ` : '';
  const topFill = '─'.repeat(Math.max(0, innerWidth - langLabel.length));
  const topBorder = chalk.cyan.dim(`┌${topFill}${langLabel}┐`);
  const bottomBorder = chalk.cyan.dim(`└${'─'.repeat(innerWidth)}┘`);

  // Syntax highlight if the language is recognised, else fall back to plain green
  let highlighted: string;
  try {
    if (lang && supportsLanguage(lang)) {
      highlighted = cliHighlight(node.value, { language: lang, ignoreIllegals: true });
    } else {
      highlighted = chalk.greenBright(node.value);
    }
  } catch {
    highlighted = chalk.greenBright(node.value);
  }

  const lines = highlighted.split('\n');
  return [
    topBorder,
    ...lines.map((l) => chalk.cyan.dim('│ ') + l),
    bottomBorder,
    '',
  ];
}

function renderMermaidBlock(source: string, width: number): string[] {
  const innerWidth = Math.max(10, width - 2);
  const label = ' mermaid ';
  const topFill = '─'.repeat(Math.max(0, innerWidth - label.length));
  const topBorder = chalk.magenta.dim(`┌${topFill}${label}┐`);
  const bottomBorder = chalk.magenta.dim(`└${'─'.repeat(innerWidth)}┘`);

  let ascii: string;
  try {
    ascii = renderMermaidASCII(source);
  } catch (err) {
    // If parsing fails, fall back to showing the raw source
    const lines = source.split('\n');
    return [
      topBorder,
      chalk.yellow.dim('  ⚠ Could not render diagram'),
      '',
      ...lines.map((l) => chalk.magenta.dim('│ ') + chalk.dim(l)),
      bottomBorder,
      '',
    ];
  }

  const diagramLines = ascii.split('\n');
  return [
    topBorder,
    ...diagramLines.map((l) => chalk.magenta.dim('│ ') + chalk.cyanBright(l)),
    bottomBorder,
    '',
  ];
}

function renderBlockquote(node: Blockquote, width: number, indent = 0): string[] {
  const border = chalk.magentaBright('│ ');
  const out: string[] = [];
  for (const child of node.children) {
    if (child.type === 'paragraph') {
      const text = renderInlines((child as Paragraph).children as PhrasingContent[]);
      const wrapped = wrapLine(text, width - 2 - indent);
      for (const line of wrapped) {
        out.push(' '.repeat(indent) + border + chalk.dim(line));
      }
    } else if (child.type === 'blockquote') {
      const inner = renderBlockquote(child as Blockquote, width - 2, indent + 2);
      for (const line of inner) {
        out.push(' '.repeat(indent) + border + line);
      }
    } else if (child.type === 'code') {
      const codeLines = renderCode(child as Code, width - 2);
      for (const line of codeLines) {
        out.push(' '.repeat(indent) + border + chalk.dim(line));
      }
    }
  }
  out.push('');
  return out;
}

function renderListItems(node: List, width: number, depth = 0): string[] {
  const out: string[] = [];
  const indent = '  '.repeat(depth);
  const ordered = node.ordered ?? false;

  for (let i = 0; i < node.children.length; i++) {
    const item = node.children[i] as ListItem;
    const bullet = ordered
      ? chalk.yellowBright(`${i + 1}.`)
      : chalk.cyanBright('•');

    for (const child of item.children) {
      if (child.type === 'paragraph') {
        const text = renderInlines((child as Paragraph).children as PhrasingContent[]);
        const prefix = `${indent}${bullet} `;
        const prefixLen = visibleLength(prefix);
        const wrapped = wrapLine(text, width - prefixLen);
        out.push(prefix + wrapped[0]);
        for (const cont of wrapped.slice(1)) {
          out.push(' '.repeat(prefixLen) + cont);
        }
      } else if (child.type === 'list') {
        out.push(...renderListItems(child as List, width, depth + 1));
      }
    }
  }

  if (depth === 0) out.push('');
  return out;
}

function renderTable(node: Table, width: number): string[] {
  const rows = node.children as TableRow[];
  if (rows.length === 0) return [];

  function getCellText(cell: TableCell): string {
    return (cell.children as PhrasingContent[])
      .map((n) => {
        if (n.type === 'text') return (n as MdastText).value;
        if ('children' in n) return (n as { children: PhrasingContent[] }).children.map(c => {
          if (c.type === 'text') return (c as MdastText).value;
          return '';
        }).join('');
        return '';
      })
      .join('');
  }

  const colWidths: number[] = [];
  rows.forEach((row) => {
    (row.children as TableCell[]).forEach((cell, ci) => {
      colWidths[ci] = Math.max(colWidths[ci] ?? 0, getCellText(cell).length, 3);
    });
  });

  const pad = (s: string, w: number) => s + ' '.repeat(Math.max(0, w - s.length));
  const sep = chalk.cyan('├' + colWidths.map((w) => '─'.repeat(w + 2)).join('┼') + '┤');

  const renderRow = (row: TableRow, isHeader: boolean): string => {
    const cells = (row.children as TableCell[]).map((cell, ci) => {
      const t = pad(getCellText(cell), colWidths[ci] ?? 0);
      return isHeader ? chalk.bold.whiteBright(t) : chalk.white(t);
    });
    return chalk.cyan('│') + cells.map((c) => ' ' + c + ' ' + chalk.cyan('│')).join('');
  };

  const out: string[] = [];
  out.push(renderRow(rows[0]!, true));
  out.push(sep);
  for (const row of rows.slice(1)) {
    out.push(renderRow(row, false));
  }
  out.push('');
  return out;
}

function renderHr(width: number): string[] {
  return [chalk.cyan.dim('─'.repeat(Math.max(1, width))), ''];
}

// ── top-level ─────────────────────────────────────────────────────────────────

export function renderToLines(ast: Root, width = 80): string[] {
  const out: string[] = [];
  const contentWidth = width - 4; // account for 2-char padding on each side

  for (const node of ast.children as Content[]) {
    switch (node.type) {
      case 'heading':
        out.push(...renderHeading(node as Heading, contentWidth));
        break;
      case 'paragraph':
        out.push(...renderParagraph(node as Paragraph, contentWidth));
        break;
      case 'code':
        out.push(...renderCode(node as Code, contentWidth));
        break;
      case 'blockquote':
        out.push(...renderBlockquote(node as Blockquote, contentWidth));
        break;
      case 'list':
        out.push(...renderListItems(node as List, contentWidth));
        break;
      case 'table':
        out.push(...renderTable(node as Table, contentWidth));
        break;
      case 'thematicBreak':
        out.push(...renderHr(contentWidth));
        break;
      case 'html':
        out.push(chalk.dim((node as { value: string }).value), '');
        break;
      default:
        break;
    }
  }

  return out;
}

// ── Table of contents ─────────────────────────────────────────────────────────

export type TocEntry = {
  depth: number;
  text: string;
  lineIndex: number; // index in the lines array where the heading text appears
};

/**
 * Walk the AST in the same order as renderToLines and record the line index
 * of each heading's text line. Must stay in sync with renderToLines.
 */
export function buildToc(ast: Root, width = 80): TocEntry[] {
  const contentWidth = width - 4;
  const entries: TocEntry[] = [];
  let lineCount = 0;

  for (const node of ast.children as Content[]) {
    switch (node.type) {
      case 'heading': {
        const h = node as Heading;
        const plain = stripAnsi(renderInlines(h.children as PhrasingContent[]));
        // H1: ['', bar, text, bar, ''] → text at offset 2
        // H2: ['', text, underline]    → text at offset 1
        // H3–H6: ['', text]            → text at offset 1
        const textOffset = h.depth === 1 ? 2 : 1;
        entries.push({ depth: h.depth, text: plain, lineIndex: lineCount + textOffset });
        lineCount += renderHeading(h, contentWidth).length;
        break;
      }
      case 'paragraph':
        lineCount += renderParagraph(node as Paragraph, contentWidth).length;
        break;
      case 'code':
        lineCount += renderCode(node as Code, contentWidth).length;
        break;
      case 'blockquote':
        lineCount += renderBlockquote(node as Blockquote, contentWidth).length;
        break;
      case 'list':
        lineCount += renderListItems(node as List, contentWidth).length;
        break;
      case 'table':
        lineCount += renderTable(node as Table, contentWidth).length;
        break;
      case 'thematicBreak':
        lineCount += renderHr(contentWidth).length;
        break;
      case 'html':
        lineCount += 2; // value + blank line
        break;
      default:
        break;
    }
  }

  return entries;
}
