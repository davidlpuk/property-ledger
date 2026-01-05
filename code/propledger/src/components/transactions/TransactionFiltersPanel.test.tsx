import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionFiltersPanel } from './TransactionFiltersPanel';

// Use minimal mock data - cast as any to avoid type strictness in tests
const mockCategories = [
  { id: 'cat1', name: 'Utilities' },
  { id: 'cat2', name: 'Rent' },
] as any;

const mockProperties = [
  { id: 'prop1', name: 'Beach House' },
  { id: 'prop2', name: 'City Apartment' },
] as any;

const mockBankAccounts = [
  { id: 'bank1', name: 'Main Account' },
] as any;

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  statusFilter: 'all' as const,
  notesFilter: 'all' as const,
  categoryFilter: '',
  propertyFilter: '',
  sourceFilter: '',
  onStatusChange: vi.fn(),
  onNotesChange: vi.fn(),
  onCategoryChange: vi.fn(),
  onPropertyChange: vi.fn(),
  onSourceChange: vi.fn(),
  onReset: vi.fn(),
  categories: mockCategories,
  properties: mockProperties,
  bankAccounts: mockBankAccounts,
};

describe('TransactionFiltersPanel', () => {
  it('renders nothing when closed', () => {
    render(<TransactionFiltersPanel {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Filters')).not.toBeInTheDocument();
  });

  it('renders filter options when open', () => {
    render(<TransactionFiltersPanel {...defaultProps} />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Property')).toBeInTheDocument();
  });

  it('displays category options', () => {
    render(<TransactionFiltersPanel {...defaultProps} />);
    // Check category options exist
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Uncategorised')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
  });

  it('displays property options', () => {
    render(<TransactionFiltersPanel {...defaultProps} />);
    expect(screen.getByText('All Properties')).toBeInTheDocument();
    expect(screen.getByText('Beach House')).toBeInTheDocument();
    expect(screen.getByText('City Apartment')).toBeInTheDocument();
  });

  it('calls onStatusChange when status is changed', () => {
    const onStatusChange = vi.fn();
    render(<TransactionFiltersPanel {...defaultProps} onStatusChange={onStatusChange} />);
    
    const statusSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(statusSelect, { target: { value: 'pending' } });
    
    expect(onStatusChange).toHaveBeenCalledWith('pending');
  });

  it('calls onCategoryChange when category is changed', () => {
    const onCategoryChange = vi.fn();
    render(<TransactionFiltersPanel {...defaultProps} onCategoryChange={onCategoryChange} />);
    
    const categorySelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(categorySelect, { target: { value: 'cat1' } });
    
    expect(onCategoryChange).toHaveBeenCalledWith('cat1');
  });

  it('calls onReset when reset button is clicked', () => {
    const onReset = vi.fn();
    render(<TransactionFiltersPanel {...defaultProps} onReset={onReset} />);
    
    const resetButton = screen.getByText('Reset All Filters');
    fireEvent.click(resetButton);
    
    expect(onReset).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<TransactionFiltersPanel {...defaultProps} onClose={onClose} />);
    
    // Find the X button (it's a button with an X icon)
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons[0]; // First button is the close button
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('shows uncategorised option in category filter', () => {
    render(<TransactionFiltersPanel {...defaultProps} />);
    expect(screen.getByText('Uncategorised')).toBeInTheDocument();
  });

  it('shows all status options', () => {
    render(<TransactionFiltersPanel {...defaultProps} />);
    // Multiple "All" options exist, so use getAllByRole
    const allOptions = screen.getAllByRole('option', { name: 'All' });
    expect(allOptions.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Posted' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Excluded' })).toBeInTheDocument();
  });

  it('shows all notes filter options', () => {
    render(<TransactionFiltersPanel {...defaultProps} />);
    expect(screen.getByRole('option', { name: 'Has Notes' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'No Notes' })).toBeInTheDocument();
  });
});
