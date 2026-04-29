/**
 * Tests for the search feature: stripAnsi utility and findMatches logic.
 * The hook's pure-logic functions are exported so they can be tested
 * independently of React rendering.
 */
import { describe, it, expect } from 'vitest';
import { stripAnsi } from '../src/utils/ansi.js';
import { findMatches } from '../src/hooks/useSearch.js';

// ── stripAnsi ────────────────────────────────────────────────────────────────

describe('stripAnsi', () => {
  it('returns plain string unchanged', () => {
    expect(stripAnsi('hello world')).toBe('hello world');
  });

  it('removes a single color code', () => {
    expect(stripAnsi('\x1b[32mhello\x1b[0m')).toBe('hello');
  });

  it('removes multiple color codes', () => {
    expect(stripAnsi('\x1b[1m\x1b[33mBold Yellow\x1b[0m text')).toBe('Bold Yellow text');
  });

  it('removes background color codes', () => {
    expect(stripAnsi('\x1b[41mred bg\x1b[0m')).toBe('red bg');
  });

  it('handles string with only ANSI codes', () => {
    expect(stripAnsi('\x1b[0m\x1b[1m\x1b[32m')).toBe('');
  });

  it('handles empty string', () => {
    expect(stripAnsi('')).toBe('');
  });

  it('handles multi-param codes like 38;5;196', () => {
    expect(stripAnsi('\x1b[38;5;196mred\x1b[0m')).toBe('red');
  });
});

// ── findMatches ───────────────────────────────────────────────────────────────

describe('findMatches', () => {
  it('returns empty array for empty query', () => {
    expect(findMatches(['hello', 'world'], '')).toEqual([]);
  });

  it('returns empty array when lines is empty', () => {
    expect(findMatches([], 'hello')).toEqual([]);
  });

  it('finds a single exact match', () => {
    expect(findMatches(['hello', 'world'], 'hello')).toEqual([0]);
  });

  it('finds multiple matches', () => {
    expect(findMatches(['foo bar', 'baz', 'foo qux'], 'foo')).toEqual([0, 2]);
  });

  it('returns empty array when no lines match', () => {
    expect(findMatches(['alpha', 'beta', 'gamma'], 'delta')).toEqual([]);
  });

  it('is case-insensitive (query is lowercased internally)', () => {
    // searchableLines are pre-lowercased in the hook; simulate that here.
    // findMatches also lowercases the query so both 'hello' and 'HELLO' match.
    const lower = ['hello world', 'foo bar'];
    expect(findMatches(lower, 'hello')).toEqual([0]);
    expect(findMatches(lower, 'HELLO')).toEqual([0]); // query is lowercased by findMatches
  });

  it('matches substring in the middle of a line', () => {
    expect(findMatches(['the quick brown fox', 'lazy dog'], 'quick')).toEqual([0]);
  });

  it('matches all lines when query appears in every line', () => {
    const lines = ['foo 1', 'foo 2', 'foo 3'];
    expect(findMatches(lines, 'foo')).toEqual([0, 1, 2]);
  });

  it('returns correct indices in order', () => {
    const lines = ['a', 'b', 'a', 'c', 'a'];
    expect(findMatches(lines, 'a')).toEqual([0, 2, 4]);
  });

  it('handles query longer than any line', () => {
    expect(findMatches(['hi', 'bye'], 'this is a very long query')).toEqual([]);
  });
});

// ── search state logic (pure functions extracted from hook behaviour) ─────────

/**
 * Simulate the core cycling logic that nextMatch() uses.
 * Ensures the modular arithmetic works for all edge cases.
 */
function simulateNextMatch(current: number, total: number): number {
  if (total === 0) return current; // guarded no-op
  return (current + 1) % total;
}

describe('nextMatch cycling logic', () => {
  it('advances to next match', () => {
    expect(simulateNextMatch(0, 5)).toBe(1);
    expect(simulateNextMatch(1, 5)).toBe(2);
  });

  it('wraps around from last match to first', () => {
    expect(simulateNextMatch(4, 5)).toBe(0);
  });

  it('stays at 0 for a single match', () => {
    expect(simulateNextMatch(0, 1)).toBe(0);
  });

  it('is a no-op when total is 0 (guard against NaN)', () => {
    const result = simulateNextMatch(0, 0);
    expect(result).toBe(0);
    expect(Number.isNaN(result)).toBe(false);
  });
});

/**
 * Simulate clamp logic used when match list shrinks.
 */
function clampMatchIndex(prev: number, newLength: number): number {
  if (newLength === 0) return 0;
  return Math.min(prev, newLength - 1);
}

describe('clampMatchIndex logic', () => {
  it('keeps index when still in range', () => {
    expect(clampMatchIndex(2, 5)).toBe(2);
  });

  it('clamps to last valid index when list shrinks', () => {
    expect(clampMatchIndex(4, 3)).toBe(2);
  });

  it('resets to 0 when match list becomes empty', () => {
    expect(clampMatchIndex(3, 0)).toBe(0);
  });

  it('handles index 0 with any non-zero length', () => {
    expect(clampMatchIndex(0, 10)).toBe(0);
  });
});

// ── Backspace / delete key handling ──────────────────────────────────────────
// In Ink, the physical Backspace key sends \x7f which Ink classifies as
// key.delete (NOT key.backspace). This section documents and tests the logic
// that must handle both to ensure backspace works in search mode.

function simulateBackspaceQuery(query: string, keyBackspace: boolean, keyDelete: boolean): string {
  if (keyBackspace || keyDelete) return query.slice(0, -1);
  return query;
}

describe('backspace key detection logic', () => {
  it('removes last character when key.backspace is true', () => {
    expect(simulateBackspaceQuery('hello', true, false)).toBe('hell');
  });

  it('removes last character when key.delete is true (physical Backspace on most terminals)', () => {
    expect(simulateBackspaceQuery('hello', false, true)).toBe('hell');
  });

  it('does not modify query when neither flag is set', () => {
    expect(simulateBackspaceQuery('hello', false, false)).toBe('hello');
  });

  it('returns empty string when deleting last character', () => {
    expect(simulateBackspaceQuery('a', false, true)).toBe('');
  });

  it('is a no-op on an already-empty query', () => {
    expect(simulateBackspaceQuery('', false, true)).toBe('');
  });
});

// ── Integration: strip + find together ───────────────────────────────────────

describe('search with ANSI-colored lines (integration)', () => {
  function normalizeLines(lines: string[]): string[] {
    return lines.map((l) => stripAnsi(l).toLowerCase());
  }

  it('finds matches in ANSI-colored lines', () => {
    const coloredLines = [
      '\x1b[32mHello World\x1b[0m',
      '\x1b[1mFoo Bar\x1b[0m',
      '\x1b[33mhello again\x1b[0m',
    ];
    const normalized = normalizeLines(coloredLines);
    expect(findMatches(normalized, 'hello')).toEqual([0, 2]);
  });

  it('finds no matches in ANSI-colored lines when query absent', () => {
    const coloredLines = ['\x1b[32mHello\x1b[0m', '\x1b[1mWorld\x1b[0m'];
    const normalized = normalizeLines(coloredLines);
    expect(findMatches(normalized, 'foo')).toEqual([]);
  });

  it('case-insensitive search through ANSI colors', () => {
    const coloredLines = ['\x1b[31mIMPORTANT NOTE\x1b[0m'];
    const normalized = normalizeLines(coloredLines);
    expect(findMatches(normalized, 'important')).toEqual([0]);
  });
});
