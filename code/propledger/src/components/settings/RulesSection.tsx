import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CategorisationRule, Category, Property } from '../../lib/types';
import { Plus, Wand2, X, Edit2, Trash2, Play, ToggleLeft, ToggleRight, Check, Globe } from 'lucide-react';

export function RulesSection() {
  const { user } = useAuth();
  const [rules, setRules] = useState<CategorisationRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategorisationRule | null>(null);
  const [formData, setFormData] = useState({ name: '', pattern: '', match_type: 'contains' as CategorisationRule['match_type'], category_id: '', property_id: '', priority: 0, is_active: true, apply_globally: false });
  const [matchingTxCount, setMatchingTxCount] = useState(0);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [pendingRule, setPendingRule] = useState<{ pattern: string; match_type: CategorisationRule['match_type']; category_id: string; property_id: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [rulesResult, catsResult, propsResult] = await Promise.all([
      supabase.from('categorisation_rules').select('*').eq('user_id', user!.id).order('priority', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('properties').select('*').eq('user_id', user!.id).order('name'),
    ]);
    const cats = catsResult.data || [];
    const props = propsResult.data || [];
    setRules((rulesResult.data || []).map(r => ({ ...r, category_name: cats.find(c => c.id === r.category_id)?.name, property_name: props.find(p => p.id === r.property_id)?.name })));
    setCategories(cats);
    setProperties(props);
    setLoading(false);
  }

  function openForm(rule?: CategorisationRule) {
    if (rule) { setEditing(rule); setFormData({ name: rule.name, pattern: rule.pattern, match_type: rule.match_type, category_id: rule.category_id || '', property_id: rule.property_id || '', priority: rule.priority, is_active: rule.is_active, apply_globally: rule.apply_globally || false }); }
    else { setEditing(null); setFormData({ name: '', pattern: '', match_type: 'contains', category_id: '', property_id: '', priority: 0, is_active: true, apply_globally: false }); }
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { user_id: user!.id, name: formData.name, pattern: formData.pattern, match_type: formData.match_type, category_id: formData.category_id || null, property_id: formData.property_id || null, priority: formData.priority, is_active: formData.is_active };

    if (editing) {
      await supabase.from('categorisation_rules').update(payload).eq('id', editing.id);
      setShowForm(false);
      loadData();
    } else {
      // Check for matching transactions before creating
      if (matchingTxCount > 0 && (formData.category_id || formData.property_id)) {
        setPendingRule({ pattern: formData.pattern, match_type: formData.match_type, category_id: formData.category_id, property_id: formData.property_id });
        setShowApplyDialog(true);
        setShowForm(false);
      } else {
        await supabase.from('categorisation_rules').insert(payload);
        setShowForm(false);
        loadData();
      }
    }
  }

  async function applyRuleToMatchingTransactions() {
    if (!pendingRule) return;

    const { pattern, match_type, category_id, property_id } = pendingRule;
    const patternLower = pattern.toLowerCase();

    // Get all user transactions
    const { data: allTxs } = await supabase.from('transactions').select('id, description').eq('user_id', user!.id);
    if (!allTxs) {
      setShowApplyDialog(false);
      setPendingRule(null);
      return;
    }

    // Find matching transactions
    const matchingIds: string[] = [];
    for (const tx of allTxs) {
      const desc = tx.description?.toLowerCase() || '';
      let matches = false;
      switch (match_type) {
        case 'contains': matches = desc.includes(patternLower); break;
        case 'starts_with': matches = desc.startsWith(patternLower); break;
        case 'ends_with': matches = desc.endsWith(patternLower); break;
        case 'exact': matches = desc === patternLower; break;
        case 'regex': try { matches = new RegExp(pattern, 'i').test(desc); } catch { matches = false; } break;
      }
      if (matches) matchingIds.push(tx.id);
    }

    if (matchingIds.length === 0) {
      setToast({ message: 'No matching transactions found', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      setShowApplyDialog(false);
      setPendingRule(null);
      return;
    }

    // Perform bulk update
    const updates: Record<string, string | null> = {};
    if (category_id) updates.category_id = category_id;
    if (property_id) updates.property_id = property_id;

    for (const id of matchingIds) {
      await supabase.from('transactions').update(updates).eq('id', id);
    }

    // Create the rule
    const rulePayload = { user_id: user!.id, name: formData.name, pattern, match_type, category_id: category_id || null, property_id: property_id || null, priority: formData.priority, is_active: formData.is_active };
    await supabase.from('categorisation_rules').insert(rulePayload);

    setShowApplyDialog(false);
    setPendingRule(null);
    setShowForm(false);
    setToast({ message: `Rule created and applied to ${matchingIds.length} transactions`, type: 'success' });
    setTimeout(() => setToast(null), 4000);
    loadData();
  }

  async function skipApply() {
    // Just create the rule without applying to existing transactions
    const rulePayload = { user_id: user!.id, name: formData.name, pattern: formData.pattern, match_type: formData.match_type, category_id: formData.category_id || null, property_id: formData.property_id || null, priority: formData.priority, is_active: formData.is_active };
    await supabase.from('categorisation_rules').insert(rulePayload);
    setShowApplyDialog(false);
    setPendingRule(null);
    setShowForm(false);
    loadData();
  }

  async function handlePatternChange(pattern: string, matchType: CategorisationRule['match_type']) {
    setFormData({ ...formData, pattern });

    if (!pattern || !user) {
      setMatchingTxCount(0);
      return;
    }

    // Check for matching transactions
    const { data: allTxs } = await supabase.from('transactions').select('id, description').eq('user_id', user.id);
    if (!allTxs) {
      setMatchingTxCount(0);
      return;
    }

    const patternLower = pattern.toLowerCase();
    let count = 0;
    for (const tx of allTxs) {
      const desc = tx.description?.toLowerCase() || '';
      let matches = false;
      switch (matchType) {
        case 'contains': matches = desc.includes(patternLower); break;
        case 'starts_with': matches = desc.startsWith(patternLower); break;
        case 'ends_with': matches = desc.endsWith(patternLower); break;
        case 'exact': matches = desc === patternLower; break;
        case 'regex': try { matches = new RegExp(pattern, 'i').test(desc); } catch { matches = false; } break;
      }
      if (matches) count++;
    }
    setMatchingTxCount(count);
  }

  async function handleMatchTypeChange(matchType: CategorisationRule['match_type']) {
    setFormData({ ...formData, match_type: matchType });
    await handlePatternChange(formData.pattern, matchType);
  }

  async function deleteRule(id: string) { if (confirm('Delete this rule?')) { await supabase.from('categorisation_rules').delete().eq('id', id); loadData(); } }
  async function toggleActive(rule: CategorisationRule) { await supabase.from('categorisation_rules').update({ is_active: !rule.is_active }).eq('id', rule.id); loadData(); }

  async function applyRules() {
    if (!confirm('Apply all active rules to pending transactions?')) return;
    const { data: pendingTxs } = await supabase.from('transactions').select('*').eq('user_id', user!.id).eq('status', 'pending').is('category_id', null);
    if (!pendingTxs || pendingTxs.length === 0) { alert('No pending uncategorized transactions.'); return; }
    const activeRules = rules.filter(r => r.is_active).sort((a, b) => b.priority - a.priority);
    let appliedCount = 0;
    for (const tx of pendingTxs) {
      const desc = tx.description?.toLowerCase() || '';
      for (const rule of activeRules) {
        let matches = false;
        const pattern = rule.pattern.toLowerCase();
        switch (rule.match_type) {
          case 'contains': matches = desc.includes(pattern); break;
          case 'starts_with': matches = desc.startsWith(pattern); break;
          case 'ends_with': matches = desc.endsWith(pattern); break;
          case 'exact': matches = desc === pattern; break;
          case 'regex': try { matches = new RegExp(rule.pattern, 'i').test(desc); } catch { matches = false; } break;
        }
        if (matches) {
          const updates: Record<string, string | null> = {};
          if (rule.category_id) updates.category_id = rule.category_id;
          if (rule.property_id) updates.property_id = rule.property_id;
          if (Object.keys(updates).length > 0) { await supabase.from('transactions').update(updates).eq('id', tx.id); appliedCount++; }
          break;
        }
      }
    }
    alert(`Applied rules to ${appliedCount} transactions.`);
    loadData();
  }

  const matchTypeLabels: Record<string, string> = { contains: 'Contains', starts_with: 'Starts with', ends_with: 'Ends with', exact: 'Exact', regex: 'Regex' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Categorisation Rules</h2>
        <div className="flex gap-2">
          <button onClick={applyRules} className="flex items-center gap-2 px-4 py-2 border border-brand-500 text-brand-600 rounded-lg hover:bg-brand-50"><Play className="w-4 h-4" /> Apply</button>
          <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"><Plus className="w-4 h-4" /> Add</button>
        </div>
      </div>
      <p className="text-neutral-500 text-sm">Rules automatically categorize transactions based on patterns. Higher priority rules are applied first.</p>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <Wand2 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No rules yet</p>
          <button onClick={() => openForm()} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">Create Your First Rule</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-neutral-500">Active</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-500">Name</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-500">Pattern</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-500">Category</th>
                <th className="px-3 py-2 text-center font-medium text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2">
                    <button onClick={() => toggleActive(rule)}>{rule.is_active ? <ToggleRight className="w-5 h-5 text-brand-500" /> : <ToggleLeft className="w-5 h-5 text-neutral-300" />}</button>
                  </td>
                  <td className="px-3 py-2 font-medium text-neutral-900">{rule.name}</td>
                  <td className="px-3 py-2 text-neutral-600 font-mono text-xs">{rule.pattern} <span className="text-neutral-400">({matchTypeLabels[rule.match_type]})</span></td>
                  <td className="px-3 py-2">{rule.category_name ? <span className="px-2 py-1 text-xs bg-brand-50 text-brand-700 rounded">{rule.category_name}</span> : '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openForm(rule)} className="p-1 text-neutral-500 hover:bg-neutral-100 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteRule(rule.id)} className="p-1 text-semantic-error hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-modal w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold text-neutral-900">{editing ? 'Edit Rule' : 'Add Rule'}</h2><button onClick={() => setShowForm(false)} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5 text-neutral-500" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Pattern *</label>
                <input
                  type="text"
                  required
                  value={formData.pattern}
                  onChange={(e) => handlePatternChange(e.target.value, formData.match_type)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {matchingTxCount > 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    {matchingTxCount} existing transaction{matchingTxCount !== 1 ? 's' : ''} match this pattern
                  </p>
                )}
              </div>
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Match Type</label><select value={formData.match_type} onChange={(e) => handleMatchTypeChange(e.target.value as CategorisationRule['match_type'])} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="contains">Contains</option><option value="starts_with">Starts with</option><option value="ends_with">Ends with</option><option value="exact">Exact</option><option value="regex">Regex</option></select></div>
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Category</label><select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Property</label><select value={formData.property_id} onChange={(e) => setFormData({ ...formData, property_id: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">None</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Priority</label><input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-brand-500 border-neutral-300 rounded" /><label htmlFor="is_active" className="text-sm text-neutral-700">Active</label></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">{editing ? 'Save' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Confirmation Dialog */}
      {showApplyDialog && pendingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setShowApplyDialog(false); setPendingRule(null); }} />
          <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-neutral-900">Apply to Existing Transactions?</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              This pattern matches <strong>{matchingTxCount}</strong> existing transaction{matchingTxCount !== 1 ? 's' : ''}.
              Would you like to apply this rule to all of them?
            </p>
            <p className="text-sm text-neutral-500 mb-4 p-2 bg-neutral-50 rounded font-mono">
              Pattern: "{pendingRule.pattern}"
            </p>
            <div className="flex gap-3">
              <button
                onClick={skipApply}
                className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50"
              >
                Just Create Rule
              </button>
              <button
                onClick={applyRuleToMatchingTransactions}
                className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Apply to All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
