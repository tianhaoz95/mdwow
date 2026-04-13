import { describe, it, expect } from 'vitest';
import { theme } from '../src/theme.js';

describe('theme', () => {
  it('has heading styles for all 6 levels', () => {
    expect(theme.h1).toBeDefined();
    expect(theme.h2).toBeDefined();
    expect(theme.h3).toBeDefined();
    expect(theme.h4).toBeDefined();
    expect(theme.h5).toBeDefined();
    expect(theme.h6).toBeDefined();
  });

  it('heading styles have color properties', () => {
    expect(theme.h1.color).toBeTruthy();
    expect(theme.h2.color).toBeTruthy();
    expect(theme.h3.color).toBeTruthy();
    expect(theme.h4.color).toBeTruthy();
  });

  it('h1 is bold', () => {
    expect(theme.h1.bold).toBe(true);
  });

  it('h2 is bold', () => {
    expect(theme.h2.bold).toBe(true);
  });

  it('has inline code style', () => {
    expect(theme.inlineCode).toBeDefined();
    expect(theme.inlineCode.color).toBeTruthy();
  });

  it('has code block style', () => {
    expect(theme.codeBlock).toBeDefined();
    expect(theme.codeBlockBorder).toBeDefined();
  });

  it('has blockquote styles', () => {
    expect(theme.blockquote).toBeDefined();
    expect(theme.blockquoteBorder).toBeDefined();
  });

  it('has list styles', () => {
    expect(theme.listBullet).toBeDefined();
    expect(theme.orderedListNumber).toBeDefined();
  });

  it('has table styles', () => {
    expect(theme.tableHeader).toBeDefined();
    expect(theme.tableSeparator).toBeDefined();
    expect(theme.tableCell).toBeDefined();
  });

  it('has UI chrome styles', () => {
    expect(theme.header).toBeDefined();
    expect(theme.statusBar).toBeDefined();
    expect(theme.liveIndicator).toBeDefined();
  });

  it('has error style', () => {
    expect(theme.error).toBeDefined();
    expect(theme.error.color).toBeTruthy();
  });

  it('h1 and h2 have distinct colors', () => {
    expect(theme.h1.color).not.toBe(theme.h2.color);
  });

  it('h2 and h3 have distinct colors', () => {
    expect(theme.h2.color).not.toBe(theme.h3.color);
  });
});
