import { useState, useCallback, useMemo, useEffect } from 'react';
import { stripAnsi } from '../utils/ansi.js';

/**
 * Find all line indices (0-based) where the query string appears.
 * Matching is case-insensitive. `searchableLines` must already be lowercased.
 */
export function findMatches(searchableLines: string[], query: string): number[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  const result: number[] = [];
  for (let i = 0; i < searchableLines.length; i++) {
    if (searchableLines[i]!.includes(lower)) result.push(i);
  }
  return result;
}

export type SearchState = {
  isActive: boolean;
  query: string;
  matchLineIndices: number[];
  matchCount: number;
  currentMatchIndex: number;
  /** The rendered-line index to scroll to, or null if no matches / not active. */
  currentLineIndex: number | null;
};

export type UseSearchReturn = SearchState & {
  activate: () => void;
  deactivate: () => void;
  appendChar: (char: string) => void;
  backspace: () => void;
  /** Advance to the next match (wraps around). No-op if there are no matches. */
  nextMatch: () => void;
};

export function useSearch(lines: string[]): UseSearchReturn {
  const [isActive, setIsActive] = useState(false);
  const [query, setQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Normalize lines once (expensive) separately from the query-driven search
  const searchableLines = useMemo(
    () => lines.map((line) => stripAnsi(line).toLowerCase()),
    [lines],
  );

  const matchLineIndices = useMemo(
    () => findMatches(searchableLines, query),
    [searchableLines, query],
  );

  // Clamp currentMatchIndex when the match list shrinks (e.g. query changed,
  // file reloaded, or terminal width changed).
  useEffect(() => {
    if (matchLineIndices.length === 0) {
      setCurrentMatchIndex(0);
    } else {
      setCurrentMatchIndex((prev) => Math.min(prev, matchLineIndices.length - 1));
    }
  }, [matchLineIndices.length]);

  const activate = useCallback(() => {
    setIsActive(true);
    setQuery('');
    setCurrentMatchIndex(0);
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setQuery('');
    setCurrentMatchIndex(0);
  }, []);

  const appendChar = useCallback((char: string) => {
    setQuery((q) => q + char);
    setCurrentMatchIndex(0);
  }, []);

  const backspace = useCallback(() => {
    setQuery((q) => q.slice(0, -1));
    setCurrentMatchIndex(0);
  }, []);

  const nextMatch = useCallback(() => {
    if (matchLineIndices.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchLineIndices.length);
  }, [matchLineIndices.length]);

  const currentLineIndex =
    isActive && matchLineIndices.length > 0
      ? (matchLineIndices[currentMatchIndex] ?? null)
      : null;

  return {
    isActive,
    query,
    matchLineIndices,
    matchCount: matchLineIndices.length,
    currentMatchIndex,
    currentLineIndex,
    activate,
    deactivate,
    appendChar,
    backspace,
    nextMatch,
  };
}
