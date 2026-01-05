import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/format';
import { Budget, Category, Property } from '../../lib/types';
import { Plus, PiggyBank, X, Edit2, Trash2 } from 'lucide-react';

export function BudgetsSection() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({ category_id: '', property_id: '', amount: '', period: 'monthly' as Budget['period'], alert_threshold: '80' });

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [budgetsResult, catsResult, propsResult, txResult] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user!.id).eq('is_active', true),
      supabase.from('categories').select('*').eq('type', 'expense'),
      supabase.from('properties').select('*').eq('user_id', user!.id).order('name'),
      supabase.from('transactions').select('*').eq('user_id', user!.id).eq('type', 'expense'),
    ]);
    const cats = catsResult.data || [];
    const props = propsResult.data || [];
    const txs = txResult.data || [];
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const currentYear = now.getFullYear();
    
    setBudgets((budgetsResult.data || []).map(b => {
      const periodTxs = txs.filter(t => {
        if (b.category_id && t.category_id !== b.category_id) return false;
        if (b.property_id && t.property_id !== b.property_id) return false;
        const txDate = new Date(t.date);
        switch (b.period) {
          case 'monthly': return t.date.startsWith(currentMonth);
          case 'quarterly': return txDate.getFullYear() === currentYear && Math.floor(txDate.getMonth() / 3) === currentQuarter;
          case 'yearly': return txDate.getFullYear() === currentYear;
          default: return false;
        }
      });
      const spent = periodTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      return { ...b, category_name: cats.find(c => c.id === b.category_id)?.name, property_name: props.find(p => p.id === b.property_id)?.name, spent, percentage: (spent / Number(b.amount)) * 100 };
    }));
    setCategories(cats);
    setProperties(props);
    setLoading(false);
  }

  function openForm(budget?: Budget) {
    if (budget) { setEditing(budget); setFormData({ category_id: budget.category_id || '', property_id: budget.property_id || '', amount: budget.amount.toString(), period: budget.period, alert_threshold: (budget.alert_threshold * 100).toString() }); }
    else { setEditing(null); setFormData({ category_id: '', property_id: '', amount: '', period: 'monthly', alert_threshold: '80' }); }
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { user_id: user!.id, category_id: formData.category_id || null, property_id: formData.property_id || null, amount: parseFloat(formData.amount), period: formData.period, alert_threshold: parseFloat(formData.alert_threshold) / 100, is_active: true };
    if (editing) await supabase.from('budgets').update(payload).eq('id', editing.id);
    else await supabase.from('budgets').insert(payload);
    setShowForm(false);
    loadData();
  }

  async function deleteBudget(id: string) { if (confirm('Delete this budget?')) { await supabase.from('budgets').delete().eq('id', id); loadData(); } }

  function getProgressColor(pct: number, threshold: number): string { if (pct >= 100) return 'bg-red-500'; if (pct >= threshold * 100) return 'bg-amber-500'; return 'bg-green-500'; }
  const periodLabels: Record<string, string> = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Budgets</h2>
        <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"><Plus className="w-4 h-4" /> Add Budget</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <PiggyBank className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No budgets yet</p>
          <button onClick={() => openForm()} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">Create Your First Budget</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {budgets.map((budget) => (
            <div key={budget.id} className="bg-white rounded-xl shadow-card p-5 hover:shadow-hover">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="font-semibold text-neutral-900">{budget.category_name || 'All Categories'}</h3><p className="text-sm text-neutral-500">{budget.property_name || 'All Properties'} - {periodLabels[budget.period]}</p></div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${(budget.percentage || 0) >= 100 ? 'bg-red-50 text-red-700' : (budget.percentage || 0) >= (budget.alert_threshold * 100) ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{Math.round(budget.percentage || 0)}%</span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1"><span className="text-neutral-500">Spent</span><span className="font-mono font-medium">{formatCurrency(budget.spent || 0)} / {formatCurrency(budget.amount)}</span></div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden"><div className={`h-full ${getProgressColor(budget.percentage || 0, budget.alert_threshold)}`} style={{ width: `${Math.min(budget.percentage || 0, 100)}%` }} /></div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-neutral-100">
                <button onClick={() => openForm(budget)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"><Edit2 className="w-4 h-4" /> Edit</button>
                <button onClick={() => deleteBudget(budget.id)} className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-semantic-error hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold text-neutral-900">{editing ? 'Edit Budget' : 'Add Budget'}</h2><button onClick={() => setShowForm(false)} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5 text-neutral-500" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Category</label><select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">All Expenses</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Property</label><select value={formData.property_id} onChange={(e) => setFormData({ ...formData, property_id: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">All Properties</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Amount *</label><input type="number" required step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Period</label><select value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value as Budget['period'] })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div>
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Alert Threshold (%)</label><input type="number" value={formData.alert_threshold} onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">{editing ? 'Save' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
