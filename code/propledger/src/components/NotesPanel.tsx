import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

interface NotesPanelProps {
  isOpen: boolean;
  notes: string;
  onSave: (notes: string) => void;
  onClose: () => void;
  transactionDescription?: string;
}

export function NotesPanel({ isOpen, notes, onSave, onClose, transactionDescription }: NotesPanelProps) {
  const [value, setValue] = useState(notes || '');

  useEffect(() => {
    setValue(notes || '');
  }, [notes, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const handleDelete = () => {
    onSave('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Transaction Notes</h2>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {transactionDescription && (
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
            <p className="text-sm text-neutral-600 truncate">{transactionDescription}</p>
          </div>
        )}

        <div className="flex-1 p-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add notes about this transaction..."
            className="w-full h-48 px-4 py-3 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="p-4 border-t border-neutral-200 flex gap-3">
          {notes && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-semantic-error hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </>
  );
}
