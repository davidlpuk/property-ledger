import { describe, it, expect } from 'vitest';

// Test the filtering logic that would be used in TransactionsContext
// These are pure function tests for the filter logic

interface MockTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'posted' | 'excluded';
  category_id: string | null;
  property_id: string | null;
  notes: string | null;
  source: string | null;
}

function applyFilters(
  transactions: MockTransaction[],
  filters: {
    status: 'all' | 'pending' | 'posted' | 'excluded';
    notes: 'all' | 'has_notes' | 'no_notes';
    category: string;
    property: string;
    source: string;
    search: string;
    dateStart: string;
    dateEnd: string;
  }
): MockTransaction[] {
  return transactions.filter(tx => {
    // Status filter
    if (filters.status !== 'all' && tx.status !== filters.status) return false;
    
    // Notes filter
    if (filters.notes === 'has_notes' && !tx.notes) return false;
    if (filters.notes === 'no_notes' && tx.notes) return false;
    
    // Category filter
    if (filters.category === '__uncategorised__' && tx.category_id) return false;
    if (filters.category && filters.category !== '__uncategorised__' && tx.category_id !== filters.category) return false;
    
    // Property filter
    if (filters.property && tx.property_id !== filters.property) return false;
    
    // Source filter
    if (filters.source && tx.source !== filters.source) return false;
    
    // Date filter
    if (filters.dateStart && tx.date < filters.dateStart) return false;
    if (filters.dateEnd && tx.date > filters.dateEnd) return false;
    
    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(query);
      const matchNotes = tx.notes?.toLowerCase().includes(query);
      if (!matchDesc && !matchNotes) return false;
    }
    
    return true;
  });
}

const mockTransactions: MockTransaction[] = [
  { id: '1', description: 'Netflix Subscription', amount: -15.99, date: '2024-01-15', status: 'posted', category_id: 'cat1', property_id: 'prop1', notes: 'Monthly entertainment', source: 'bank1' },
  { id: '2', description: 'Rent Payment', amount: 1500, date: '2024-01-01', status: 'posted', category_id: 'cat2', property_id: 'prop1', notes: null, source: 'bank1' },
  { id: '3', description: 'Unknown Expense', amount: -50, date: '2024-01-20', status: 'pending', category_id: null, property_id: null, notes: null, source: 'bank2' },
  { id: '4', description: 'Utility Bill', amount: -120, date: '2024-02-05', status: 'posted', category_id: 'cat3', property_id: 'prop2', notes: 'Electric bill', source: 'bank1' },
  { id: '5', description: 'Excluded Transaction', amount: -10, date: '2024-01-25', status: 'excluded', category_id: null, property_id: null, notes: null, source: 'bank1' },
];

const defaultFilters = {
  status: 'all' as const,
  notes: 'all' as const,
  category: '',
  property: '',
  source: '',
  search: '',
  dateStart: '',
  dateEnd: '',
};

describe('TransactionsContext Filtering Logic', () => {
  describe('Status Filter', () => {
    it('returns all transactions when status is "all"', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, status: 'all' });
      expect(result.length).toBe(5);
    });

    it('filters by pending status', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, status: 'pending' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('3');
    });

    it('filters by posted status', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, status: 'posted' });
      expect(result.length).toBe(3);
    });

    it('filters by excluded status', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, status: 'excluded' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('5');
    });
  });

  describe('Category Filter', () => {
    it('filters by specific category', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, category: 'cat1' });
      expect(result.length).toBe(1);
      expect(result[0].description).toBe('Netflix Subscription');
    });

    it('filters uncategorised transactions', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, category: '__uncategorised__' });
      expect(result.length).toBe(2);
      expect(result.every(t => t.category_id === null)).toBe(true);
    });
  });

  describe('Property Filter', () => {
    it('filters by property', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, property: 'prop1' });
      expect(result.length).toBe(2);
    });

    it('returns all when property filter is empty', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, property: '' });
      expect(result.length).toBe(5);
    });
  });

  describe('Notes Filter', () => {
    it('filters transactions with notes', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, notes: 'has_notes' });
      expect(result.length).toBe(2);
      expect(result.every(t => t.notes !== null)).toBe(true);
    });

    it('filters transactions without notes', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, notes: 'no_notes' });
      expect(result.length).toBe(3);
      expect(result.every(t => t.notes === null)).toBe(true);
    });
  });

  describe('Date Filter', () => {
    it('filters by start date', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, dateStart: '2024-01-20' });
      expect(result.length).toBe(3);
    });

    it('filters by end date', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, dateEnd: '2024-01-15' });
      expect(result.length).toBe(2);
    });

    it('filters by date range', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, dateStart: '2024-01-10', dateEnd: '2024-01-25' });
      expect(result.length).toBe(3);
    });
  });

  describe('Search Filter', () => {
    it('searches in description', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, search: 'netflix' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    it('searches in notes', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, search: 'electric' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('4');
    });

    it('is case insensitive', () => {
      const result = applyFilters(mockTransactions, { ...defaultFilters, search: 'RENT' });
      expect(result.length).toBe(1);
    });
  });

  describe('Combined Filters', () => {
    it('applies multiple filters together', () => {
      const result = applyFilters(mockTransactions, {
        ...defaultFilters,
        status: 'posted',
        property: 'prop1',
      });
      expect(result.length).toBe(2);
    });

    it('returns empty array when no matches', () => {
      const result = applyFilters(mockTransactions, {
        ...defaultFilters,
        status: 'pending',
        category: 'cat1',
      });
      expect(result.length).toBe(0);
    });
  });
});
