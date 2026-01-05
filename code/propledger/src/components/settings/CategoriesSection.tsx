import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Category } from '../../lib/types';
import { Plus, Search, Edit2, Trash2, X, Check, Loader2, Tag } from 'lucide-react';

export function CategoriesSection() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValue, setFormValue] = useState('');
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; count: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { if ((showAddForm || editingId) && inputRef.current) inputRef.current.focus(); }, [showAddForm, editingId]);

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  const validateName = (name: string, excludeId?: string): string | null => {
    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (!trimmed) return 'Category name is required';
    if (trimmed.length > 50) return 'Max 50 characters';
    if (!/^[a-zA-Z0-9\s\-&]+$/.test(trimmed)) return 'Only letters, numbers, spaces, hyphens, and &';
    if (categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== excludeId)) return 'Category already exists';
    return null;
  };

  const handleCreate = async () => {
    const trimmed = formValue.trim().replace(/\s+/g, ' ');
    const validationError = validateName(trimmed);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError('');
    const { error: insertError } = await supabase.from('categories').insert({ name: trimmed, type: formType, is_default: false, iva_rate: 0, is_deductible: formType === 'expense', user_id: user?.id });
    if (insertError) { setError('Failed to create'); setSaving(false); return; }
    await loadCategories();
    setShowAddForm(false);
    setFormValue('');
    setSaving(false);
  };

  const handleUpdate = async (id: string) => {
    const trimmed = formValue.trim().replace(/\s+/g, ' ');
    const validationError = validateName(trimmed, id);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase.from('categories').update({ name: trimmed }).eq('id', id);
    if (updateError) { setError('Failed to update'); setSaving(false); return; }
    await loadCategories();
    setEditingId(null);
    setFormValue('');
    setSaving(false);
  };

  const handleDeleteConfirm = async (id: string, name: string) => {
    const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('category_id', id);
    setDeleteConfirm({ id, name, count: count || 0 });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    await supabase.from('transactions').update({ category_id: null }).eq('category_id', deleteConfirm.id);
    await supabase.from('categories').delete().eq('id', deleteConfirm.id);
    await loadCategories();
    setSaving(false);
    setDeleteConfirm(null);
  };

  const startEdit = (cat: Category) => { setEditingId(cat.id); setFormValue(cat.name); setError(''); };
  const cancelEdit = () => { setEditingId(null); setFormValue(''); setError(''); };
  const cancelAdd = () => { setShowAddForm(false); setFormValue(''); setFormType('expense'); setError(''); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Categories</h2>
        <button onClick={() => { setShowAddForm(true); setError(''); }} disabled={showAddForm || saving} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"><Plus className="w-4 h-4" /> Add</button>
      </div>

      <div className="bg-white rounded-xl shadow-card">
        <div className="p-4 border-b border-neutral-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {showAddForm && (
            <div className="p-4 bg-brand-50">
              <div className="flex items-center gap-3">
                <input ref={inputRef} type="text" value={formValue} onChange={(e) => { setFormValue(e.target.value); setError(''); }} placeholder="Category name" maxLength={50} className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${error ? 'border-semantic-error' : 'border-neutral-200'}`} onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') cancelAdd(); }} />
                <select value={formType} onChange={(e) => setFormType(e.target.value as 'income' | 'expense')} className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="expense">Expense</option><option value="income">Income</option></select>
                <button onClick={handleCreate} disabled={saving} className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}</button>
                <button onClick={cancelAdd} disabled={saving} className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {error && <p className="mt-2 text-sm text-semantic-error">{error}</p>}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div></div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">{search ? 'No categories match' : 'No categories yet'}</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {filteredCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50">
                  {editingId === cat.id ? (
                    <div className="flex-1 flex items-center gap-3">
                      <input ref={inputRef} type="text" value={formValue} onChange={(e) => { setFormValue(e.target.value); setError(''); }} maxLength={50} className={`flex-1 px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-brand-500 ${error ? 'border-semantic-error' : 'border-neutral-200'}`} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(cat.id); if (e.key === 'Escape') cancelEdit(); }} />
                      <button onClick={() => handleUpdate(cat.id)} disabled={saving} className="p-1 text-brand-500 hover:bg-brand-50 rounded">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}</button>
                      <button onClick={cancelEdit} disabled={saving} className="p-1 text-neutral-500 hover:bg-neutral-100 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-neutral-400" />
                        <span className="font-medium text-neutral-900">{cat.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded ${cat.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>{cat.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(cat)} className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteConfirm(cat.id, cat.name)} className="p-2 text-neutral-400 hover:text-semantic-error hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {editingId && error && <div className="px-4 py-2 bg-red-50"><p className="text-sm text-semantic-error">{error}</p></div>}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !saving && setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Delete Category</h2>
            <p className="text-neutral-600 mb-4">Delete "{deleteConfirm.name}"?{deleteConfirm.count > 0 && <span className="block mt-2 text-amber-600">{deleteConfirm.count} transaction(s) will become uncategorised.</span>}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={saving} className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-semantic-error text-white rounded-lg hover:bg-red-600">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
