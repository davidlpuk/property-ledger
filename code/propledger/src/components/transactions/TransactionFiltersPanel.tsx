import React from 'react';
import { X } from 'lucide-react';
import { StatusFilter, NotesFilter } from '../../contexts/TransactionsContext';
import { Category, Property, BankAccount } from '../../lib/types';

interface TransactionFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Filter values
  statusFilter: StatusFilter;
  notesFilter: NotesFilter;
  categoryFilter: string;
  propertyFilter: string;
  sourceFilter: string;
  // Filter setters
  onStatusChange: (value: StatusFilter) => void;
  onNotesChange: (value: NotesFilter) => void;
  onCategoryChange: (value: string) => void;
  onPropertyChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onReset: () => void;
  // Data for dropdowns
  categories: Category[];
  properties: Property[];
  bankAccounts: BankAccount[];
}

export function TransactionFiltersPanel({
  isOpen,
  onClose,
  statusFilter,
  notesFilter,
  categoryFilter,
  propertyFilter,
  sourceFilter,
  onStatusChange,
  onNotesChange,
  onCategoryChange,
  onPropertyChange,
  onSourceChange,
  onReset,
  categories,
  properties,
  bankAccounts,
}: TransactionFiltersPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-900">Filters</h3>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="posted">Posted</option>
            <option value="excluded">Excluded</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            <option value="__uncategorised__">Uncategorised</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Property Filter */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Property</label>
          <select
            value={propertyFilter}
            onChange={(e) => onPropertyChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Properties</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Source</label>
          <select
            value={sourceFilter}
            onChange={(e) => onSourceChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Sources</option>
            {bankAccounts.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Notes Filter */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Notes</label>
          <select
            value={notesFilter}
            onChange={(e) => onNotesChange(e.target.value as NotesFilter)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All</option>
            <option value="has_notes">Has Notes</option>
            <option value="no_notes">No Notes</option>
          </select>
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="w-full py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
        >
          Reset All Filters
        </button>
      </div>
    </div>
  );
}
