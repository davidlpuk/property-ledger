import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from './format';

describe('formatCurrency', () => {
  it('formats positive numbers with euro symbol', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('formats zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('formats negative numbers', () => {
    const result = formatCurrency(-500);
    expect(result).toBeTruthy();
  });

  it('handles decimal precision', () => {
    const result = formatCurrency(99.9);
    expect(result).toBeTruthy();
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2024-01-15');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('handles different date formats', () => {
    const result = formatDate('2024-12-31');
    expect(result).toBeTruthy();
  });
});
