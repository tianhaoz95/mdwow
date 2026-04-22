/**
 * Light and dark themes for both the Ink UI chrome and the string renderer.
 */

import type { TextStyle } from './theme.js';

// ── Renderer theme (chalk colors used in renderer.ts) ─────────────────────────

export type RendererTheme = {
  // Headings
  h1Bar: string;         // chalk color for H1 ═ bars and text
  h2Text: string;        // H2 text
  h2Underline: string;   // H2 ─ underline
  h3: string;            // H3 ▸ text
  h4: string;            // H4 text
  h5: string;            // H5 text
  h6: string;            // H6 text

  // Inline
  bold: string;          // **bold**
  link: string;          // [link]()
  image: string;         // ![image]()
  inlineCodeBg: string;  // background for `code`
  inlineCodeFg: string;  // foreground for `code`

  // Code block
  codeBorder: string;    // ┌─┐ borders
  codeText: string;      // plain code text (no syntax highlight)

  // Mermaid
  mermaidBorder: string;
  mermaidDiagram: string;

  // Blockquote
  blockquoteBorder: string;

  // List
  bullet: string;        // • unordered
  number: string;        // 1. ordered

  // Table
  tableBorder: string;   // │ ├ ┼ ┤
  tableHeader: string;   // header cell text
  tableCell: string;     // body cell text

  // HR
  hr: string;

  // cli-highlight theme name ('atom-one-dark' | 'atom-one-light' | 'github-gist' etc.)
  syntaxTheme: string;
};

export const darkRendererTheme: RendererTheme = {
  h1Bar:          'magentaBright',
  h2Text:         'cyanBright',
  h2Underline:    'cyanBright',
  h3:             'yellowBright',
  h4:             'greenBright',
  h5:             'blueBright',
  h6:             'white',

  bold:           'whiteBright',
  link:           'blueBright',
  image:          'blue',
  inlineCodeBg:   'bgGray',
  inlineCodeFg:   'yellowBright',

  codeBorder:     'cyan',
  codeText:       'greenBright',

  mermaidBorder:  'magenta',
  mermaidDiagram: 'whiteBright',

  blockquoteBorder: 'magentaBright',

  bullet:  'cyanBright',
  number:  'yellowBright',

  tableBorder: 'cyan',
  tableHeader: 'whiteBright',
  tableCell:   'white',

  hr: 'cyan',

  syntaxTheme: 'atom-one-dark',
};

export const lightRendererTheme: RendererTheme = {
  h1Bar:          'magenta',
  h2Text:         'cyan',
  h2Underline:    'cyan',
  h3:             'yellow',       // darker yellow readable on white
  h4:             'green',
  h5:             'blue',
  h6:             'black',

  bold:           'black',
  link:           'blue',
  image:          'blue',
  inlineCodeBg:   'bgWhiteBright',
  inlineCodeFg:   'red',

  codeBorder:     'blue',
  codeText:       'green',

  mermaidBorder:  'magenta',
  mermaidDiagram: 'blue',

  blockquoteBorder: 'magenta',

  bullet:  'cyan',
  number:  'yellow',

  tableBorder: 'blue',
  tableHeader: 'black',
  tableCell:   'black',

  hr: 'blue',

  syntaxTheme: 'atom-one-light',
};

// ── Ink UI theme (used by Header, StatusBar, Sidebar, etc.) ──────────────────

export type InkTheme = {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  h5: TextStyle;
  h6: TextStyle;

  bold: TextStyle;
  italic: TextStyle;
  strikethrough: TextStyle;

  inlineCode: TextStyle;
  codeBlock: TextStyle;
  codeBlockBorder: TextStyle;

  blockquote: TextStyle;
  blockquoteBorder: TextStyle;

  link: TextStyle;
  hr: TextStyle;

  listBullet: TextStyle;
  orderedListNumber: TextStyle;

  tableHeader: TextStyle;
  tableSeparator: TextStyle;
  tableCell: TextStyle;

  header: TextStyle;
  headerBg: string;
  liveIndicator: TextStyle;
  liveIndicatorUpdating: TextStyle;
  appName: TextStyle;

  statusBar: TextStyle;
  statusKey: TextStyle;
  scrollInfo: TextStyle;

  error: TextStyle;
  errorBorder: TextStyle;
  warning: TextStyle;

  image: TextStyle;
  html: TextStyle;
  paragraph: TextStyle;
  text: TextStyle;

  borderColor: string;
  tocCursor: TextStyle;
  tocActive: TextStyle;
  tocNormal: TextStyle;
};

export const darkInkTheme: InkTheme = {
  h1: { color: 'magentaBright', bold: true },
  h2: { color: 'cyanBright', bold: true },
  h3: { color: 'yellowBright', bold: true },
  h4: { color: 'greenBright', bold: true },
  h5: { color: 'blueBright' },
  h6: { color: 'blue' },

  bold: { bold: true, color: 'whiteBright' },
  italic: { italic: true },
  strikethrough: { dimColor: true },

  inlineCode: { color: 'yellowBright', backgroundColor: 'gray' },
  codeBlock: { color: 'greenBright' },
  codeBlockBorder: { color: 'cyan', dimColor: true },

  blockquote: { color: 'white', dimColor: true },
  blockquoteBorder: { color: 'magentaBright', bold: true },

  link: { color: 'blueBright', underline: true },
  hr: { color: 'cyan', dimColor: true },

  listBullet: { color: 'cyanBright', bold: true },
  orderedListNumber: { color: 'yellowBright', bold: true },

  tableHeader: { bold: true, color: 'whiteBright' },
  tableSeparator: { color: 'cyan' },
  tableCell: { color: 'white' },

  header: { color: 'whiteBright', bold: true },
  headerBg: 'blue',
  liveIndicator: { color: 'greenBright', bold: true },
  liveIndicatorUpdating: { color: 'yellowBright', bold: true },
  appName: { color: 'whiteBright', bold: true },

  statusBar: { dimColor: true },
  statusKey: { color: 'cyanBright', bold: true },
  scrollInfo: { color: 'white', dimColor: true },

  error: { color: 'redBright', bold: true },
  errorBorder: { color: 'red' },
  warning: { color: 'yellowBright' },

  image: { color: 'blue', dimColor: true },
  html: { dimColor: true },
  paragraph: { color: 'white' },
  text: { color: 'white' },

  borderColor: 'blue',
  tocCursor: { color: 'black', backgroundColor: 'cyanBright' } as TextStyle,
  tocActive: { color: 'cyanBright' },
  tocNormal: { color: 'white', dimColor: true },
};

export const lightInkTheme: InkTheme = {
  h1: { color: 'magenta', bold: true },
  h2: { color: 'cyan', bold: true },
  h3: { color: 'yellow', bold: true },
  h4: { color: 'green', bold: true },
  h5: { color: 'blue' },
  h6: { color: 'black' },

  bold: { bold: true, color: 'black' },
  italic: { italic: true },
  strikethrough: { dimColor: true },

  inlineCode: { color: 'red', backgroundColor: 'whiteBright' },
  codeBlock: { color: 'green' },
  codeBlockBorder: { color: 'blue', dimColor: true },

  blockquote: { color: 'black', dimColor: true },
  blockquoteBorder: { color: 'magenta', bold: true },

  link: { color: 'blue', underline: true },
  hr: { color: 'blue', dimColor: true },

  listBullet: { color: 'cyan', bold: true },
  orderedListNumber: { color: 'yellow', bold: true },

  tableHeader: { bold: true, color: 'black' },
  tableSeparator: { color: 'blue' },
  tableCell: { color: 'black' },

  header: { color: 'black', bold: true },
  headerBg: 'cyan',
  liveIndicator: { color: 'green', bold: true },
  liveIndicatorUpdating: { color: 'yellow', bold: true },
  appName: { color: 'black', bold: true },

  statusBar: { dimColor: true },
  statusKey: { color: 'blue', bold: true },
  scrollInfo: { color: 'black', dimColor: true },

  error: { color: 'red', bold: true },
  errorBorder: { color: 'red' },
  warning: { color: 'yellow' },

  image: { color: 'blue', dimColor: true },
  html: { dimColor: true },
  paragraph: { color: 'black' },
  text: { color: 'black' },

  borderColor: 'cyan',
  tocCursor: { color: 'white', backgroundColor: 'blue' } as TextStyle,
  tocActive: { color: 'blue' },
  tocNormal: { color: 'black', dimColor: true },
};

export type ThemeMode = 'dark' | 'light';
