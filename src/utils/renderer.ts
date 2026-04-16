/**
 * Pure string renderer: Markdown AST → array of ANSI-colored strings (one per line).
 * No React/Ink involved. This makes scrolling instant — we just slice the array.
 */

// cli-highlight uses chalk internally and checks chalk.level for color support.
// Set FORCE_COLOR before any imports so its chalk instance picks it up.
process.env.FORCE_COLOR = '3';

import chalk from 'chalk';
import { highlight as cliHighlight, supportsLanguage } from 'cli-highlight';
import { darkRendererTheme, type RendererTheme } from '../themes.js';
import { renderMermaidASCII } from 'beautiful-mermaid';
import type {
  Root,
  Content,
  BlockContent,
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

// ── Active theme ──────────────────────────────────────────────────────────────
// All render functions read from this. Call setRendererTheme() to switch themes.

let T: RendererTheme = darkRendererTheme;

export function setRendererTheme(theme: RendererTheme): void {
  T = theme;
}

// ── inline rendering ──────────────────────────────────────────────────────────

function renderInline(node: PhrasingContent): string {
  switch (node.type) {
    case 'text':
      return (node as MdastText).value;
    case 'strong':
      return chalk.bold[T.bold]((node as Strong).children.map(renderInline).join(''));
    case 'emphasis':
      return chalk.italic((node as Emphasis).children.map(renderInline).join(''));
    case 'delete':
      return chalk.dim((node as Delete).children.map(renderInline).join(''));
    case 'inlineCode':
      return (chalk[T.inlineCodeBg] as typeof chalk)[T.inlineCodeFg](` ${(node as InlineCode).value} `);
    case 'link': {
      const n = node as Link;
      const label = n.children.length > 0 ? n.children.map(renderInline).join('') : n.url;
      return chalk[T.link].underline(label);
    }
    case 'image': {
      const n = node as Image;
      return chalk[T.image].dim(`[image: ${n.alt || n.url}]`);
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

// ── Link span tracking ────────────────────────────────────────────────────────

export type LinkSpan = {
  lineIndex: number;
  colStart: number; // visible column, 0-indexed
  colEnd: number;   // exclusive
  url: string;
};

type InlineSpan = { colStart: number; colEnd: number; url: string };

/**
 * After wrapLine() splits a text into multiple lines, re-map inline spans
 * (which have column positions in the original unwrapped text) to the correct
 * (lineOffset, colStart, colEnd) in the wrapped output.
 *
 * Returns only spans that are fully visible on a single wrapped line.
 */
function remapSpansAfterWrap(
  text: string,
  spans: InlineSpan[],
  width: number,
  baseLine: number,
): LinkSpan[] {
  if (spans.length === 0) return [];

  // Simulate wrapLine to build a map: unwrappedCol → (wrappedLineIndex, wrappedCol)
  const words = text.split(' ');
  const lineMap: Array<{ lineIdx: number; startCol: number }> = []; // per-char mapping
  let currentLine = 0;
  let currentCol = 0;
  let charPos = 0;

  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi]!;
    const wordLen = visibleLength(word);
    const test = currentCol === 0 ? word : ' '.repeat(1) + word;
    const testLen = currentCol === 0 ? wordLen : 1 + wordLen;

    if (currentCol > 0 && currentCol + testLen > width) {
      // wrap: record the space as end of previous line, start new line
      lineMap[charPos] = { lineIdx: currentLine, startCol: currentCol };
      charPos++;
      currentLine++;
      currentCol = 0;
    } else if (currentCol > 0) {
      // space before word
      lineMap[charPos] = { lineIdx: currentLine, startCol: currentCol };
      charPos++;
      currentCol++;
    }

    // record each char of the word
    for (let ci = 0; ci < wordLen; ci++) {
      lineMap[charPos] = { lineIdx: currentLine, startCol: currentCol };
      charPos++;
      currentCol++;
    }
  }

  const result: LinkSpan[] = [];
  for (const span of spans) {
    const startInfo = lineMap[span.colStart];
    const endInfo   = lineMap[Math.max(span.colStart, span.colEnd - 1)];
    if (!startInfo || !endInfo) continue;
    // Only track spans that fit on a single wrapped line
    if (startInfo.lineIdx !== endInfo.lineIdx) continue;
    const labelLen = span.colEnd - span.colStart;
    result.push({
      lineIndex: baseLine + startInfo.lineIdx,
      colStart:  startInfo.startCol,
      colEnd:    startInfo.startCol + labelLen,
      url: span.url,
    });
  }
  return result;
}

/** Like renderInlines but also returns the column ranges of every link. */
function renderInlinesTracked(
  nodes: PhrasingContent[],
): { text: string; spans: InlineSpan[] } {
  const spans: InlineSpan[] = [];
  let col = 0;
  const parts: string[] = [];

  for (const node of nodes) {
    if (node.type === 'link') {
      const n = node as Link;
      const label = n.children.length > 0 ? n.children.map(renderInline).join('') : n.url;
      const rendered = chalk[T.link].underline(stripAnsi(label));
      const visLen = visibleLength(rendered);
      spans.push({ colStart: col, colEnd: col + visLen, url: n.url });
      parts.push(rendered);
      col += visLen;
    } else {
      const rendered = renderInline(node);
      col += visibleLength(rendered);
      parts.push(rendered);
    }
  }

  return { text: parts.join(''), spans };
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

function renderHeadingFromText(depth: number, text: string, width: number): string[] {
  if (depth === 1) {
    const bar = chalk[T.h1Bar]('═'.repeat(width));
    return ['', bar, chalk.bold[T.h1Bar]('  ' + text), bar, ''];
  }
  if (depth === 2) {
    return ['', chalk.bold[T.h2Text](text), chalk[T.h2Underline].dim('─'.repeat(width))];
  }
  if (depth === 3) return ['', chalk.bold[T.h3]('▸ ' + text)];
  if (depth === 4) return ['', chalk.bold[T.h4](text)];
  if (depth === 5) return ['', chalk[T.h5](text)];
  return ['', chalk[T.h6].dim(text)];
}

function renderHeading(node: Heading, width: number): string[] {
  const text = renderInlines(node.children as PhrasingContent[]);
  return renderHeadingFromText(node.depth, text, width);
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
  const topBorder = chalk[T.codeBorder].dim(`┌${topFill}${langLabel}┐`);
  const bottomBorder = chalk[T.codeBorder].dim(`└${'─'.repeat(innerWidth)}┘`);

  // Syntax highlight if the language is recognised, else fall back to theme code color
  let highlighted: string;
  try {
    if (lang && supportsLanguage(lang)) {
      highlighted = cliHighlight(node.value, { language: lang, ignoreIllegals: true });
    } else {
      highlighted = chalk[T.codeText](node.value);
    }
  } catch {
    highlighted = chalk[T.codeText](node.value);
  }

  const lines = highlighted.split('\n');
  return [
    topBorder,
    ...lines.map((l) => chalk[T.codeBorder].dim('│ ') + l),
    bottomBorder,
    '',
  ];
}

function renderMermaidBlock(source: string, width: number): string[] {
  const innerWidth = Math.max(10, width - 2);
  const label = ' mermaid ';
  const topFill = '─'.repeat(Math.max(0, innerWidth - label.length));
  const topBorder = chalk[T.mermaidBorder].dim(`┌${topFill}${label}┐`);
  const bottomBorder = chalk[T.mermaidBorder].dim(`└${'─'.repeat(innerWidth)}┘`);

  let ascii: string;
  try {
    ascii = renderMermaidASCII(source);
  } catch (err) {
    const lines = source.split('\n');
    return [
      topBorder,
      chalk.yellow.dim('  ⚠ Could not render diagram'),
      '',
      ...lines.map((l) => chalk[T.mermaidBorder].dim('│ ') + chalk.dim(l)),
      bottomBorder,
      '',
    ];
  }

  const diagramLines = ascii.split('\n');
  return [
    topBorder,
    ...diagramLines.map((l) => chalk[T.mermaidBorder].dim('│ ') + chalk[T.mermaidDiagram](l)),
    bottomBorder,
    '',
  ];
}

function renderBlockquote(node: Blockquote, width: number, indent = 0): string[] {
  const border = chalk[T.blockquoteBorder]('│ ');
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
      ? chalk[T.number](`${i + 1}.`)
      : chalk[T.bullet]('•');

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
  const sep = chalk[T.tableBorder]('├' + colWidths.map((w) => '─'.repeat(w + 2)).join('┼') + '┤');

  const renderRow = (row: TableRow, isHeader: boolean): string => {
    const cells = (row.children as TableCell[]).map((cell, ci) => {
      const t = pad(getCellText(cell), colWidths[ci] ?? 0);
      return isHeader ? chalk.bold[T.tableHeader](t) : chalk[T.tableCell](t);
    });
    return chalk[T.tableBorder]('│') + cells.map((c) => ' ' + c + ' ' + chalk[T.tableBorder]('│')).join('');
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
  return [chalk[T.hr].dim('─'.repeat(Math.max(1, width))), ''];
}

// ── Link collection helpers for nested blocks ─────────────────────────────────

function collectBlockquoteLinks(
  node: Blockquote,
  baseLineIndex: number,
  width: number,
  out: LinkSpan[],
  indent = 0,
): void {
  // Each paragraph in a blockquote renders as: '│ ' + text (prefix = 2 visible chars)
  const prefix = 2 + indent;
  let lineOffset = 0;
  for (const child of node.children) {
    if (child.type === 'paragraph') {
      const { text, spans } = renderInlinesTracked((child as Paragraph).children as PhrasingContent[]);
      const wrapped = wrapLine(text, width - prefix);
      for (const span of spans) {
        out.push({
          lineIndex: baseLineIndex + lineOffset,
          colStart: prefix + span.colStart,
          colEnd: prefix + span.colEnd,
          url: span.url,
        });
      }
      lineOffset += wrapped.length;
    } else if (child.type === 'blockquote') {
      const innerLines = renderBlockquote(child as Blockquote, width - prefix).length;
      collectBlockquoteLinks(child as Blockquote, baseLineIndex + lineOffset, width - prefix, out, indent + 2);
      lineOffset += innerLines;
    } else {
      lineOffset += renderBlockquote({ type: 'blockquote', children: [child as BlockContent] }, width).length;
    }
  }
}

function collectListLinks(
  node: List,
  baseLineIndex: number,
  width: number,
  out: LinkSpan[],
  depth = 0,
): void {
  const ordered = node.ordered ?? false;
  const indent = '  '.repeat(depth);
  let lineOffset = 0;

  for (let i = 0; i < node.children.length; i++) {
    const item = node.children[i] as ListItem;
    const bullet = ordered ? `${i + 1}.` : '•';
    const prefixLen = visibleLength(`${indent}${bullet} `);

    for (const child of item.children) {
      if (child.type === 'paragraph') {
        const { text, spans } = renderInlinesTracked((child as Paragraph).children as PhrasingContent[]);
        const wrapped = wrapLine(text, width - prefixLen);
        for (const span of spans) {
          out.push({
            lineIndex: baseLineIndex + lineOffset,
            colStart: prefixLen + span.colStart,
            colEnd: prefixLen + span.colEnd,
            url: span.url,
          });
        }
        lineOffset += wrapped.length;
      } else if (child.type === 'list') {
        const innerLines = renderListItems(child as List, width, depth + 1).length;
        collectListLinks(child as List, baseLineIndex + lineOffset, width, out, depth + 1);
        lineOffset += innerLines;
      }
    }
  }
}

// ── top-level ─────────────────────────────────────────────────────────────────

export function renderToLines(ast: Root, width = 80): string[] {
  return renderToLinesWithLinks(ast, width).lines;
}

export function renderToLinesWithLinks(
  ast: Root,
  width = 80,
): { lines: string[]; links: LinkSpan[] } {
  const lines: string[] = [];
  const links: LinkSpan[] = [];
  const contentWidth = width - 4;

  function pushLines(newLines: string[], newLinks?: InlineSpan[]) {
    if (newLinks) {
      const baseLineIndex = lines.length;
      for (const span of newLinks) {
        links.push({ ...span, lineIndex: baseLineIndex });
      }
    }
    lines.push(...newLines);
  }

  for (const node of ast.children as Content[]) {
    switch (node.type) {
      case 'heading': {
        const h = node as Heading;
        // Headings can contain links — track them on the text line
        const children = h.children as PhrasingContent[];
        const { text, spans } = renderInlinesTracked(children);
        const headingLines = renderHeadingFromText(h.depth, text, contentWidth);
        // text line offset: H1 → 2, others → 1
        const textLineOffset = h.depth === 1 ? 2 : 1;
        const baseLineIndex = lines.length + textLineOffset;
        for (const span of spans) {
          links.push({ ...span, lineIndex: baseLineIndex });
        }
        lines.push(...headingLines);
        break;
      }
      case 'paragraph': {
        const para = node as Paragraph;
        const { text, spans } = renderInlinesTracked(para.children as PhrasingContent[]);
        // Split on hard line breaks (\n from <break> nodes) and handle each segment
        const segments = text.split('\n');
        const plainSegments = stripAnsi(text).split('\n');
        const baseLineIndex = lines.length;
        let segLineOffset = 0;
        let segColOffset = 0; // cumulative col offset in the original span coords
        for (let si = 0; si < segments.length; si++) {
          const seg = segments[si]!;
          const plainSeg = plainSegments[si]!;
          const segLines = wrapLine(seg, contentWidth);
          // Adjust spans: only include spans whose colStart falls within this segment
          const segStart = segColOffset;
          const segEnd = segColOffset + visibleLength(seg);
          const segSpans = spans
            .filter(s => s.colStart >= segStart && s.colEnd <= segEnd + 1)
            .map(s => ({ ...s, colStart: s.colStart - segStart, colEnd: s.colEnd - segStart }));
          const remapped = remapSpansAfterWrap(plainSeg, segSpans, contentWidth, baseLineIndex + segLineOffset);
          links.push(...remapped);
          lines.push(...segLines);
          segLineOffset += segLines.length;
          segColOffset = segEnd + 1; // +1 for the \n
        }
        lines.push(''); // blank line after paragraph
        break;
      }
      case 'code':
        pushLines(renderCode(node as Code, contentWidth));
        break;
      case 'blockquote': {
        const bqLines = renderBlockquote(node as Blockquote, contentWidth);
        collectBlockquoteLinks(node as Blockquote, lines.length, contentWidth, links);
        lines.push(...bqLines);
        break;
      }
      case 'list': {
        const listLines = renderListItems(node as List, contentWidth);
        collectListLinks(node as List, lines.length, contentWidth, links);
        lines.push(...listLines);
        break;
      }
      case 'table':
        pushLines(renderTable(node as Table, contentWidth));
        break;
      case 'thematicBreak':
        pushLines(renderHr(contentWidth));
        break;
      case 'html':
        lines.push(chalk.dim((node as { value: string }).value), '');
        break;
      default:
        break;
    }
  }

  return { lines, links };
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
