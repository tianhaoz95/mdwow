import { describe, it, expect } from 'vitest';
import { renderToLines } from '../src/utils/renderer.js';
import { parseMarkdown } from '../src/utils/parser.js';

// Strip ANSI escape codes to get plain text for assertions
function strip(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function lines(md: string, width = 80): string[] {
  return renderToLines(parseMarkdown(md), width).map(strip);
}

function joined(md: string, width = 80): string {
  return lines(md, width).join('\n');
}

describe('renderToLines — headings', () => {
  it('H1 produces ═ decorator bars', () => {
    const ls = lines('# Title');
    expect(ls.some((l) => l.includes('═'))).toBe(true);
  });

  it('H1 has two ═ bars (top and bottom)', () => {
    const ls = lines('# Title');
    expect(ls.filter((l) => l.match(/^═+$/))).toHaveLength(2);
  });

  it('H1 text appears between the bars', () => {
    const ls = lines('# My Title');
    const barIdx = ls.findIndex((l) => l.match(/^═+$/));
    const textIdx = ls.findIndex((l) => l.includes('My Title'));
    expect(textIdx).toBeGreaterThan(barIdx);
    expect(ls.slice(textIdx + 1).some((l) => l.match(/^═+$/))).toBe(true);
  });

  it('H1 text is indented with two spaces', () => {
    const ls = lines('# Title');
    const textLine = ls.find((l) => l.includes('Title'))!;
    expect(textLine).toMatch(/^  /);
  });

  it('H2 produces ── prefix and suffix', () => {
    expect(joined('## Section')).toContain('── Section ──');
  });

  it('H2 produces ─ underline on next line', () => {
    const ls = lines('## Section');
    const underline = ls.find((l) => l.match(/^─+$/));
    expect(underline).toBeDefined();
  });

  it('H3 produces ▸ prefix', () => {
    expect(joined('### Sub')).toContain('▸ Sub');
  });

  it('H4 produces #### prefix', () => {
    expect(joined('#### Detail')).toContain('#### Detail');
  });

  it('H5 produces ##### prefix', () => {
    expect(joined('##### Minor')).toContain('##### Minor');
  });

  it('H6 produces ###### prefix', () => {
    expect(joined('###### Tiny')).toContain('###### Tiny');
  });
});

describe('renderToLines — paragraphs', () => {
  it('renders plain text', () => {
    expect(joined('Hello world')).toContain('Hello world');
  });

  it('renders bold text content', () => {
    expect(joined('**bold text**')).toContain('bold text');
  });

  it('renders italic text content', () => {
    expect(joined('_italic_')).toContain('italic');
  });

  it('renders strikethrough text content', () => {
    expect(joined('~~removed~~')).toContain('removed');
  });

  it('renders inline code value', () => {
    expect(joined('Use `npm install`')).toContain('npm install');
  });

  it('renders link label', () => {
    expect(joined('[GitHub](https://github.com)')).toContain('GitHub');
  });

  it('renders image as placeholder', () => {
    expect(joined('![alt](img.png)')).toContain('[image: alt]');
  });

  it('adds blank line after paragraph', () => {
    const ls = lines('Hello');
    // Last line before end should be blank
    expect(ls[ls.length - 1]).toBe('');
  });

  it('wraps long lines to fit width', () => {
    const longText = 'word '.repeat(30).trim();
    const ls = lines(longText, 40);
    // Every non-empty line should be <= 40 visible chars
    ls.filter((l) => l.trim().length > 0).forEach((l) => {
      expect(l.length).toBeLessThanOrEqual(40);
    });
  });
});

describe('renderToLines — code blocks', () => {
  it('renders ┌ top border', () => {
    expect(joined('```\ncode\n```')).toContain('┌');
  });

  it('renders └ bottom border', () => {
    expect(joined('```\ncode\n```')).toContain('└');
  });

  it('top and bottom borders have equal length', () => {
    const ls = lines('```\nconst x = 1;\n```', 40);
    const top = ls.find((l) => l.includes('┌'))!;
    const bot = ls.find((l) => l.includes('└'))!;
    expect(top.length).toBe(bot.length);
  });

  it('each code line has │ prefix', () => {
    const ls = lines('```\nline1\nline2\n```');
    const prefixed = ls.filter((l) => l.startsWith('│ '));
    expect(prefixed).toHaveLength(2);
  });

  it('renders language label in top border', () => {
    const ls = lines('```python\nx = 1\n```');
    const top = ls.find((l) => l.includes('┌'))!;
    expect(top).toContain('python');
  });

  it('renders multi-line code', () => {
    const j = joined('```\nconst a = 1;\nconst b = 2;\n```');
    expect(j).toContain('const a = 1;');
    expect(j).toContain('const b = 2;');
  });
});

describe('renderToLines — blockquotes', () => {
  it('renders │ prefix on each quoted line', () => {
    const ls = lines('> A quote');
    const prefixed = ls.filter((l) => l.includes('│'));
    expect(prefixed.length).toBeGreaterThan(0);
  });

  it('│ is followed by a space and then text', () => {
    expect(joined('> hello')).toContain('│ hello');
  });

  it('renders bold inside blockquote', () => {
    expect(joined('> **important**')).toContain('important');
  });
});

describe('renderToLines — lists', () => {
  it('renders • for unordered items', () => {
    const j = joined('- A\n- B\n- C');
    expect((j.match(/•/g) ?? []).length).toBe(3);
  });

  it('• precedes item text', () => {
    expect(joined('- Hello')).toContain('• Hello');
  });

  it('renders numbers for ordered list', () => {
    const j = joined('1. First\n2. Second');
    expect(j).toContain('1. First');
    expect(j).toContain('2. Second');
  });

  it('nested list items are indented more than parent', () => {
    const ls = lines('- Parent\n  - Child');
    const parentLine = ls.find((l) => l.includes('Parent'))!;
    const childLine = ls.find((l) => l.includes('Child'))!;
    const parentIndent = parentLine.match(/^(\s*)/)?.[1]?.length ?? 0;
    const childIndent = childLine.match(/^(\s*)/)?.[1]?.length ?? 0;
    expect(childIndent).toBeGreaterThan(parentIndent);
  });
});

describe('renderToLines — tables', () => {
  const tableMd = '| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |';

  it('renders header cells', () => {
    const j = joined(tableMd);
    expect(j).toContain('Name');
    expect(j).toContain('Age');
  });

  it('renders body cells', () => {
    const j = joined(tableMd);
    expect(j).toContain('Alice');
    expect(j).toContain('30');
  });

  it('renders │ column separators', () => {
    expect(joined(tableMd)).toContain('│');
  });

  it('renders ├ ┼ ┤ separator row', () => {
    const j = joined(tableMd);
    expect(j).toContain('├');
    expect(j).toContain('┼');
    expect(j).toContain('┤');
  });

  it('separator row has same length as header row', () => {
    const ls = lines(tableMd);
    const header = ls.find((l) => l.startsWith('│'))!;
    const sep = ls.find((l) => l.startsWith('├'))!;
    expect(sep.length).toBe(header.length);
  });

  it('body rows have same length as header row', () => {
    const ls = lines(tableMd);
    const dataRows = ls.filter((l) => l.startsWith('│'));
    const len = dataRows[0]!.length;
    dataRows.forEach((r) => expect(r.length).toBe(len));
  });
});

describe('renderToLines — horizontal rule', () => {
  it('renders ─ characters', () => {
    expect(joined('---')).toMatch(/─+/);
  });

  it('rule line is only ─ characters', () => {
    const ls = lines('---');
    const rule = ls.find((l) => l.match(/^─+$/));
    expect(rule).toBeDefined();
  });
});

describe('renderToLines — full document', () => {
  const doc = `# Title

Paragraph with **bold** and _italic_ and \`code\`.

## Section

- Item A
- Item B

1. One
2. Two

\`\`\`js
console.log("hi");
\`\`\`

> A blockquote

---

| Col | Val |
|-----|-----|
| foo | bar |
`;

  it('renders without throwing', () => {
    expect(() => renderToLines(parseMarkdown(doc), 80)).not.toThrow();
  });

  it('returns an array of strings', () => {
    const result = renderToLines(parseMarkdown(doc), 80);
    expect(Array.isArray(result)).toBe(true);
    result.forEach((l) => expect(typeof l).toBe('string'));
  });

  it('contains all heading text', () => {
    const j = joined(doc);
    expect(j).toContain('Title');
    expect(j).toContain('Section');
  });

  it('contains paragraph inline content', () => {
    const j = joined(doc);
    expect(j).toContain('bold');
    expect(j).toContain('italic');
    expect(j).toContain('code');
  });

  it('contains list bullets', () => {
    expect(joined(doc)).toContain('• Item A');
  });

  it('contains ordered list numbers', () => {
    expect(joined(doc)).toContain('1. One');
  });

  it('contains code block borders', () => {
    const j = joined(doc);
    expect(j).toContain('┌');
    expect(j).toContain('└');
  });

  it('contains blockquote border', () => {
    expect(joined(doc)).toContain('│ A blockquote');
  });

  it('contains table separator', () => {
    const j = joined(doc);
    expect(j).toContain('├');
    expect(j).toContain('┼');
  });

  it('empty document returns empty array', () => {
    expect(renderToLines(parseMarkdown(''), 80)).toHaveLength(0);
  });
});
