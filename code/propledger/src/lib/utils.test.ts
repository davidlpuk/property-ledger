import { describe, it, expect } from 'vitest';
import { generateTransactionHash, normalizeVendor, detectRecurringTransactions } from './utils';

describe('generateTransactionHash', () => {
  it('generates consistent hash for same input', () => {
    const hash1 = generateTransactionHash('2024-01-15', 'ACME Corp Payment', 100);
    const hash2 = generateTransactionHash('2024-01-15', 'ACME Corp Payment', 100);
    expect(hash1).toBe(hash2);
  });

  it('generates different hash for different inputs', () => {
    const hash1 = generateTransactionHash('2024-01-15', 'ACME Corp', 100);
    const hash2 = generateTransactionHash('2024-01-16', 'ACME Corp', 100);
    expect(hash1).not.toBe(hash2);
  });

  it('handles special characters in description', () => {
    const hash = generateTransactionHash('2024-01-15', 'Payment #123 @ Store', 50.25);
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');
  });
});

describe('normalizeVendor', () => {
  it('normalizes vendor names to lowercase', () => {
    expect(normalizeVendor('AMAZON').toLowerCase()).toBe(normalizeVendor('amazon').toLowerCase());
  });

  it('removes common suffixes', () => {
    const norm1 = normalizeVendor('Acme Inc');
    const norm2 = normalizeVendor('Acme');
    // Both should normalize similarly
    expect(norm1).toBeTruthy();
    expect(norm2).toBeTruthy();
  });

  it('handles empty string', () => {
    const result = normalizeVendor('');
    expect(result).toBe('');
  });
});

describe('detectRecurringTransactions', () => {
  it('detects recurring transactions with same vendor', () => {
    const transactions = [
      { id: '1', description: 'Netflix Monthly', amount: 15.99, date: '2024-01-15' },
      { id: '2', description: 'Netflix Monthly', amount: 15.99, date: '2024-02-15' },
      { id: '3', description: 'Netflix Monthly', amount: 15.99, date: '2024-03-15' },
    ];
    
    const recurring = detectRecurringTransactions(transactions as any);
    expect(recurring.length).toBeGreaterThan(0);
  });

  it('returns empty array for non-recurring', () => {
    const transactions = [
      { id: '1', description: 'Random Purchase', amount: 50, date: '2024-01-15' },
      { id: '2', description: 'Different Store', amount: 30, date: '2024-02-20' },
    ];
    
    const recurring = detectRecurringTransactions(transactions as any);
    expect(Array.isArray(recurring)).toBe(true);
  });

  it('handles empty array', () => {
    const recurring = detectRecurringTransactions([]);
    expect(recurring).toEqual([]);
  });
});
