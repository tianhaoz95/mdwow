/**
 * Tests for highlightQuery — injects reverse-video ANSI markers around
 * every occurrence of a query in an ANSI-coloured string.
 */
import { describe, it, expect } from 'vitest';
import { stripAnsi, highlightQuery } from '../src/utils/ansi.js';

// Helper: strip all ANSI to get plain text for content assertions
const plain = (s: string) => stripAnsi(s);

// Marker tokens used in default highlight
const ON  = '\x1b[7m';
const OFF = '\x1b[27m';

describe('highlightQuery — plain strings', () => {
  it('returns original string unchanged when query is empty', () => {
    expect(highlightQuery('hello world', '')).toBe('hello world');
  });

  it('returns original string unchanged when query is not found', () => {
    expect(highlightQuery('hello world', 'xyz')).toBe('hello world');
  });

  it('wraps a single match with highlight markers', () => {
    const result = highlightQuery('hello world', 'world');
    expect(result).toBe(`hello ${ON}world${OFF}`);
  });

  it('wraps a match at the beginning of the string', () => {
    const result = highlightQuery('hello world', 'hello');
    expect(result).toBe(`${ON}hello${OFF} world`);
  });

  it('wraps a match at the end of the string', () => {
    const result = highlightQuery('say hello', 'hello');
    expect(result).toBe(`say ${ON}hello${OFF}`);
  });

  it('wraps multiple occurrences', () => {
    const result = highlightQuery('foo bar foo', 'foo');
    expect(result).toBe(`${ON}foo${OFF} bar ${ON}foo${OFF}`);
  });

  it('is case-insensitive', () => {
    const result = highlightQuery('Hello World', 'hello');
    expect(result).toContain(ON);
    expect(plain(result)).toBe('Hello World');
  });

  it('preserves plain text content after highlighting', () => {
    const result = highlightQuery('alpha beta gamma', 'beta');
    expect(plain(result)).toBe('alpha beta gamma');
  });

  it('handles query equal to the entire string', () => {
    const result = highlightQuery('hello', 'hello');
    expect(result).toBe(`${ON}hello${OFF}`);
  });

  it('handles overlapping-start occurrences (aaa with query aa)', () => {
    // First match at 0..2, next search starts at 1, finds 1..3
    const result = highlightQuery('aaa', 'aa');
    expect(plain(result)).toBe('aaa');
    expect(result).toContain(ON);
  });
});

describe('highlightQuery — ANSI-coloured strings', () => {
  it('preserves ANSI escape sequences in the output', () => {
    const line = '\x1b[32mhello world\x1b[0m';
    const result = highlightQuery(line, 'world');
    expect(result).toContain('\x1b[32m');
    expect(result).toContain('\x1b[0m');
  });

  it('plain text content is unchanged after highlighting ANSI line', () => {
    const line = '\x1b[32mHello World\x1b[0m';
    expect(plain(highlightQuery(line, 'World'))).toBe('Hello World');
  });

  it('injects highlight markers around a match inside an ANSI span', () => {
    const line = '\x1b[32mhello world\x1b[0m';
    const result = highlightQuery(line, 'world');
    expect(result).toContain(`${ON}world${OFF}`);
  });

  it('injects highlight markers around a match that spans an ANSI boundary', () => {
    // "he" is green, "llo" is yellow; query is "hello"
    const line = '\x1b[32mhe\x1b[0m\x1b[33mllo\x1b[0m';
    const result = highlightQuery(line, 'hello');
    expect(plain(result)).toBe('hello');
    expect(result).toContain(ON);
    expect(result).toContain(OFF);
  });

  it('highlights multiple matches in an ANSI line', () => {
    const line = '\x1b[32mfoo\x1b[0m bar \x1b[33mfoo\x1b[0m';
    const result = highlightQuery(line, 'foo');
    const onCount  = (result.match(/\x1b\[7m/g)  ?? []).length;
    const offCount = (result.match(/\x1b\[27m/g) ?? []).length;
    expect(onCount).toBe(2);
    expect(offCount).toBe(2);
  });

  it('closes any unclosed highlight at end of string', () => {
    // Match is at the very end of the plain text
    const line = '\x1b[32mword\x1b[0m';
    const result = highlightQuery(line, 'word');
    const opens  = (result.match(/\x1b\[7m/g)  ?? []).length;
    const closes = (result.match(/\x1b\[27m/g) ?? []).length;
    expect(opens).toBe(closes);
  });

  it('handles empty ANSI-only string (no plain text)', () => {
    const line = '\x1b[0m\x1b[32m';
    expect(highlightQuery(line, 'hello')).toBe(line);
  });
});

describe('highlightQuery — custom highlight codes', () => {
  it('uses provided highlightOn / highlightOff codes', () => {
    const result = highlightQuery(
      'hello world',
      'world',
      '\x1b[7m\x1b[1m',
      '\x1b[27m\x1b[22m',
    );
    expect(result).toContain('\x1b[7m\x1b[1m');
    expect(result).toContain('\x1b[27m\x1b[22m');
    expect(plain(result)).toBe('hello world');
  });
});
