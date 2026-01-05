import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BankAccount, Property } from '../../lib/types';
import { Plus, Landmark, X, Edit2, Trash2 } from 'lucide-react';

export function BankAccountsSection() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({ name: '', bank_name: '', default_property_id: '' });

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [accResult, propResult] = await Promise.all([
      supabase.from('bank_accounts').select('*').eq('user_id', user!.id).order('name'),
      supabase.from('properties').select('*').eq('user_id', user!.id).order('name'),
    ]);
    const props = propResult.data || [];
    setAccounts((accResult.data || []).map(a => ({ ...a, default_property_name: props.find(p => p.id === a.default_property_id)?.name })));
    setProperties(props);
    setLoading(false);
  }

  function openForm(acc?: BankAccount) {
    if (acc) {
      setEditing(acc);
      setFormData({ name: acc.name, bank_name: acc.bank_name || '', default_property_id: acc.default_property_id || '' });
    } else {
      setEditing(null);
      setFormData({ name: '', bank_name: '', default_property_id: '' });
    }
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { user_id: user!.id, name: formData.name, bank_name: formData.bank_name || null, default_property_id: formData.default_property_id || null };
    if (editing) await supabase.from('bank_accounts').update(payload).eq('id', editing.id);
    else await supabase.from('bank_accounts').insert(payload);
    setShowForm(false);
    loadData();
  }

  async function deleteAccount(id: string) {
    if (confirm('Delete this bank account?')) {
      await supabase.from('bank_accounts').delete().eq('id', id);
      loadData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Bank Accounts</h2>
        <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <Landmark className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No bank accounts yet</p>
          <button onClick={() => openForm()} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">Add Your First Account</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-xl shadow-card p-5 hover:shadow-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">{acc.name}</h3>
                  {acc.bank_name && <p className="text-sm text-neutral-500">{acc.bank_name}</p>}
                </div>
                <Landmark className="w-5 h-5 text-brand-500" />
              </div>
              {acc.default_property_name && <p className="text-sm text-neutral-500">Default: <span className="font-medium">{acc.default_property_name}</span></p>}
              <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-100">
                <button onClick={() => openForm(acc)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"><Edit2 className="w-4 h-4" /> Edit</button>
                <button onClick={() => deleteAccount(acc.id)} className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-semantic-error hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">{editing ? 'Edit Bank Account' : 'Add Bank Account'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5 text-neutral-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Account Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g., Main Account" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Bank Name</label>
                <input type="text" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g., Santander" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Default Property</label>
                <select value={formData.default_property_id} onChange={(e) => setFormData({ ...formData, default_property_id: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">None</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">{editing ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
