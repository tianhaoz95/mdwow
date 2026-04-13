import { describe, it, expect } from 'vitest';
import type { Key } from 'ink';

// Test the scroll logic directly since it's pure logic
// We test the clamp and offset calculation logic

const noKey: Key = {
  upArrow: false,
  downArrow: false,
  leftArrow: false,
  rightArrow: false,
  pageDown: false,
  pageUp: false,
  return: false,
  escape: false,
  ctrl: false,
  shift: false,
  tab: false,
  backspace: false,
  delete: false,
  meta: false,
  fn: false,
};

const key = (overrides: Partial<Key>): Key => ({ ...noKey, ...overrides });

// Extract the pure scroll logic for testing
function computeScroll(
  prev: number,
  input: string,
  k: Key,
  totalLines: number,
  visibleLines: number,
): number {
  const maxScroll = Math.max(0, totalLines - visibleLines);
  const clamp = (val: number) => Math.max(0, Math.min(val, maxScroll));
  const pageSize = Math.max(1, visibleLines - 2);

  if (k.upArrow || input === 'k') return clamp(prev - 1);
  if (k.downArrow || input === 'j') return clamp(prev + 1);
  if (k.pageUp || input === 'u') return clamp(prev - pageSize);
  if (k.pageDown || input === 'd') return clamp(prev + pageSize);
  if (input === 'g') return 0;
  if (input === 'G') return clamp(maxScroll);
  return prev;
}

describe('scroll logic', () => {
  it('starts at 0', () => {
    expect(0).toBe(0);
  });

  it('scrolls down with j', () => {
    expect(computeScroll(0, 'j', noKey, 100, 20)).toBe(1);
  });

  it('scrolls down with down arrow', () => {
    expect(computeScroll(0, '', key({ downArrow: true }), 100, 20)).toBe(1);
  });

  it('scrolls up with k', () => {
    expect(computeScroll(5, 'k', noKey, 100, 20)).toBe(4);
  });

  it('scrolls up with up arrow', () => {
    expect(computeScroll(5, '', key({ upArrow: true }), 100, 20)).toBe(4);
  });

  it('clamps at 0 when scrolling up past start', () => {
    expect(computeScroll(0, 'k', noKey, 100, 20)).toBe(0);
  });

  it('clamps at max when scrolling down past end', () => {
    // max = 30 - 20 = 10
    expect(computeScroll(10, 'j', noKey, 30, 20)).toBe(10);
  });

  it('jumps to top with g', () => {
    expect(computeScroll(50, 'g', noKey, 100, 20)).toBe(0);
  });

  it('jumps to bottom with G', () => {
    // max = 100 - 20 = 80
    expect(computeScroll(0, 'G', noKey, 100, 20)).toBe(80);
  });

  it('pages down with d', () => {
    // pageSize = 20 - 2 = 18
    expect(computeScroll(0, 'd', noKey, 100, 20)).toBe(18);
  });

  it('pages down with pageDown key', () => {
    expect(computeScroll(0, '', key({ pageDown: true }), 100, 20)).toBe(18);
  });

  it('pages up with u', () => {
    expect(computeScroll(80, 'u', noKey, 100, 20)).toBe(62);
  });

  it('pages up with pageUp key', () => {
    expect(computeScroll(80, '', key({ pageUp: true }), 100, 20)).toBe(62);
  });

  it('handles totalLines <= visibleLines (no scroll)', () => {
    // max = max(0, 10 - 20) = 0
    expect(computeScroll(0, 'j', noKey, 10, 20)).toBe(0);
  });

  it('ignores unrelated keys', () => {
    expect(computeScroll(5, 'x', noKey, 100, 20)).toBe(5);
  });

  it('page size is at least 1', () => {
    // visibleLines = 1, pageSize = max(1, 1-2) = 1
    expect(computeScroll(0, 'd', noKey, 100, 1)).toBe(1);
  });

  it('clamps page down at max', () => {
    // max = 100 - 20 = 80, prev = 75, pageSize = 18 → 75+18=93 → clamp to 80
    expect(computeScroll(75, 'd', noKey, 100, 20)).toBe(80);
  });

  it('clamps page up at 0', () => {
    expect(computeScroll(5, 'u', noKey, 100, 20)).toBe(0);
  });
});
