export type TextStyle = {
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  dimColor?: boolean;
};

export const theme = {
  h1: { color: 'magentaBright', bold: true } satisfies TextStyle,
  h2: { color: 'cyanBright', bold: true } satisfies TextStyle,
  h3: { color: 'yellowBright', bold: true } satisfies TextStyle,
  h4: { color: 'blueBright', bold: true } satisfies TextStyle,
  h5: { color: 'blueBright' } satisfies TextStyle,
  h6: { color: 'blue' } satisfies TextStyle,

  bold: { bold: true, color: 'whiteBright' } satisfies TextStyle,
  italic: { italic: true } satisfies TextStyle,
  strikethrough: { dimColor: true } satisfies TextStyle,

  inlineCode: { color: 'yellowBright', backgroundColor: 'gray' } satisfies TextStyle,
  codeBlock: { color: 'greenBright' } satisfies TextStyle,
  codeBlockBorder: { color: 'cyan', dimColor: true } satisfies TextStyle,
  codeBlockLang: { color: 'cyan', dimColor: true, italic: true } satisfies TextStyle,

  blockquote: { color: 'white', dimColor: true } satisfies TextStyle,
  blockquoteBorder: { color: 'magentaBright', bold: true } satisfies TextStyle,

  link: { color: 'blueBright', underline: true } satisfies TextStyle,
  linkUrl: { color: 'blue', dimColor: true } satisfies TextStyle,

  hr: { color: 'cyan', dimColor: true } satisfies TextStyle,

  listBullet: { color: 'cyanBright', bold: true } satisfies TextStyle,
  orderedListNumber: { color: 'yellowBright', bold: true } satisfies TextStyle,

  tableHeader: { bold: true, color: 'whiteBright' } satisfies TextStyle,
  tableSeparator: { color: 'cyan' } satisfies TextStyle,
  tableCell: { color: 'white' } satisfies TextStyle,

  header: { color: 'whiteBright', bold: true } satisfies TextStyle,
  headerBg: 'blueBright',
  liveIndicator: { color: 'greenBright', bold: true } satisfies TextStyle,
  liveIndicatorUpdating: { color: 'yellowBright', bold: true } satisfies TextStyle,
  appName: { color: 'whiteBright', bold: true } satisfies TextStyle,

  statusBar: { dimColor: true } satisfies TextStyle,
  statusKey: { color: 'cyanBright', bold: true } satisfies TextStyle,
  scrollInfo: { color: 'white', dimColor: true } satisfies TextStyle,

  error: { color: 'redBright', bold: true } satisfies TextStyle,
  errorBorder: { color: 'red' } satisfies TextStyle,
  warning: { color: 'yellowBright' } satisfies TextStyle,

  image: { color: 'blue', dimColor: true } satisfies TextStyle,
  html: { dimColor: true } satisfies TextStyle,

  paragraph: { color: 'white' } satisfies TextStyle,
  text: { color: 'white' } satisfies TextStyle,
} as const;
