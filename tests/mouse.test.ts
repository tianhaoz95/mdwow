import { describe, it, expect } from 'vitest';
import { parseSgrMouse } from '../src/utils/mouse.js';

function buf(str: string): Buffer {
  return Buffer.from(str, 'binary');
}

describe('parseSgrMouse', () => {
  it('returns scroll_up for button 64', () => {
    const result = parseSgrMouse(buf('\x1b[<64;10;20M'));
    expect(result).not.toBeNull();
    expect(result?.type).toBe('scroll_up');
  });

  it('returns scroll_down for button 65', () => {
    const result = parseSgrMouse(buf('\x1b[<65;10;20M'));
    expect(result).not.toBeNull();
    expect(result?.type).toBe('scroll_down');
  });

  it('parses x coordinate correctly', () => {
    const result = parseSgrMouse(buf('\x1b[<64;42;10M'));
    expect(result?.x).toBe(42);
  });

  it('parses y coordinate correctly', () => {
    const result = parseSgrMouse(buf('\x1b[<64;10;99M'));
    expect(result?.y).toBe(99);
  });

  it('returns press for button 0 (left click)', () => {
    const result = parseSgrMouse(buf('\x1b[<0;1;1M'));
    expect(result?.type).toBe('press');
    expect(result?.button).toBe(0);
  });

  it('returns release for trailing m', () => {
    const result = parseSgrMouse(buf('\x1b[<0;1;1m'));
    expect(result?.type).toBe('release');
  });

  it('returns null for plain keyboard data', () => {
    expect(parseSgrMouse(buf('hello'))).toBeNull();
  });

  it('returns null for non-SGR escape sequence', () => {
    expect(parseSgrMouse(buf('\x1b[A'))).toBeNull(); // up arrow
  });

  it('returns null for empty buffer', () => {
    expect(parseSgrMouse(buf(''))).toBeNull();
  });

  it('returns null for malformed SGR (missing semicolons)', () => {
    expect(parseSgrMouse(buf('\x1b[<64M'))).toBeNull();
  });

  it('returns null for malformed SGR (no terminator)', () => {
    expect(parseSgrMouse(buf('\x1b[<64;1;1'))).toBeNull();
  });

  it('parses sequence embedded in larger buffer', () => {
    // Extra bytes before the sequence (e.g. from buffered stdin)
    const result = parseSgrMouse(buf('abc\x1b[<65;5;5M'));
    expect(result?.type).toBe('scroll_down');
  });

  it('scroll_up has correct button value', () => {
    const result = parseSgrMouse(buf('\x1b[<64;1;1M'));
    expect(result?.button).toBe(64);
  });

  it('scroll_down has correct button value', () => {
    const result = parseSgrMouse(buf('\x1b[<65;1;1M'));
    expect(result?.button).toBe(65);
  });
});
