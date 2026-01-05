import React from 'react';
import { X, Paperclip, MessageSquare } from 'lucide-react';
import { Transaction, Category, Property } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/format';
import { CategorySelect } from '../CategorySelect';

interface TransactionDetailsModalProps {
  transaction: Transaction;
  categories: Category[];
  properties: Property[];
  onClose: () => void;
  onCategoryChange: (categoryId: string | null) => void;
  onPropertyChange: (propertyId: string | null) => void;
  onNotesClick: () => void;
  onAttachmentsClick: () => void;
  attachmentCount: number;
}

export function TransactionDetailsModal({
  transaction,
  categories,
  properties,
  onClose,
  onCategoryChange,
  onPropertyChange,
  onNotesClick,
  onAttachmentsClick,
  attachmentCount,
}: TransactionDetailsModalProps) {
  const category = categories.find(c => c.id === transaction.category_id);
  const property = properties.find(p => p.id === transaction.property_id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount & Date */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Amount</p>
              <p className={`text-2xl font-bold font-mono ${
                transaction.type === 'income' ? 'text-semantic-success' : 'text-neutral-900'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-500">Date</p>
              <p className="text-lg font-medium text-neutral-900">{formatDate(transaction.date)}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-neutral-500 mb-1">Description</p>
            <p className="text-neutral-900">{transaction.description || 'No description'}</p>
          </div>

          {/* Status Badge */}
          <div>
            <p className="text-sm text-neutral-500 mb-1">Status</p>
            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
              transaction.status === 'posted' ? 'bg-green-100 text-green-700' :
              transaction.status === 'excluded' ? 'bg-neutral-100 text-neutral-500' :
              'bg-amber-100 text-amber-700'
            }`}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </span>
          </div>

          {/* Category */}
          <div>
            <p className="text-sm text-neutral-500 mb-2">Category</p>
            <CategorySelect
              value={transaction.category_id || ''}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              onChange={(val) => onCategoryChange(val || null)}
              placeholder="Select category..."
            />
          </div>

          {/* Property */}
          <div>
            <p className="text-sm text-neutral-500 mb-2">Property</p>
            <select
              value={transaction.property_id || ''}
              onChange={(e) => onPropertyChange(e.target.value || null)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">No property</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Notes Preview */}
          {transaction.notes && (
            <div>
              <p className="text-sm text-neutral-500 mb-1">Notes</p>
              <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg">
                {transaction.notes.length > 100 
                  ? transaction.notes.slice(0, 100) + '...' 
                  : transaction.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onNotesClick}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              {transaction.notes ? 'Edit Notes' : 'Add Notes'}
            </button>
            <button
              onClick={onAttachmentsClick}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              Attachments
              {attachmentCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-brand-100 text-brand-600 rounded-full">
                  {attachmentCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
