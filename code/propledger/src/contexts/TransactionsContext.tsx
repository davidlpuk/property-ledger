import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { Transaction, Category, Property, BankAccount } from '../lib/types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Filter types
export type StatusFilter = 'all' | 'pending' | 'posted' | 'excluded';
export type NotesFilter = 'all' | 'has_notes' | 'no_notes';
export type SortDir = 'asc' | 'desc';

interface TransactionsFilters {
  status: StatusFilter;
  notes: NotesFilter;
  category: string;
  property: string;
  source: string;
  search: string;
  dateStart: string;
  dateEnd: string;
  sortDir: SortDir;
}

interface TransactionsContextValue {
  // Data
  transactions: Transaction[];
  categories: Category[];
  properties: Property[];
  bankAccounts: BankAccount[];
  loading: boolean;
  
  // Filters
  filters: TransactionsFilters;
  setFilter: <K extends keyof TransactionsFilters>(key: K, value: TransactionsFilters[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  
  // Filtered data
  filteredTransactions: Transaction[];
  
  // Actions
  loadData: () => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

const defaultFilters: TransactionsFilters = {
  status: 'all',
  notes: 'all',
  category: '',
  property: '',
  source: '',
  search: '',
  dateStart: '',
  dateEnd: '',
  sortDir: 'desc',
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children, initialFilters }: { children: ReactNode; initialFilters?: Partial<TransactionsFilters> }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionsFilters>({ ...defaultFilters, ...initialFilters });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    const [txResult, catResult, propResult, bankResult] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('properties').select('*').eq('user_id', user.id).order('name', { ascending: true }),
      supabase.from('bank_accounts').select('*').eq('user_id', user.id),
    ]);
    
    setTransactions(txResult.data || []);
    setCategories((catResult.data || []).sort((a, b) => a.name.localeCompare(b.name)));
    setProperties(propResult.data || []);
    setBankAccounts(bankResult.data || []);
    setLoading(false);
  }, [user]);

  const refreshTransactions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    setTransactions(data || []);
  }, [user]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    await supabase.from('transactions').update(updates).eq('id', id);
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  }, []);

  const setFilter = useCallback(<K extends keyof TransactionsFilters>(key: K, value: TransactionsFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.notes !== 'all') count++;
    if (filters.category) count++;
    if (filters.property) count++;
    if (filters.source) count++;
    if (filters.dateStart || filters.dateEnd) count++;
    return count;
  }, [filters]);

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(tx => {
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

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return filters.sortDir === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [transactions, filters]);

  const value: TransactionsContextValue = {
    transactions,
    categories,
    properties,
    bankAccounts,
    loading,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    filteredTransactions,
    loadData,
    updateTransaction,
    refreshTransactions,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}
