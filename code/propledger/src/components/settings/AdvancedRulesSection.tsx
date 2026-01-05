import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AdvancedRule, Property } from '../../lib/types';
import { Plus, X, Edit2, Trash2, ToggleLeft, ToggleRight, Calendar, Hash } from 'lucide-react';

export function AdvancedRulesSection() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AdvancedRule[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdvancedRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    description_match: '',
    match_type: 'contains' as 'contains' | 'exact' | 'regex',
    provider_match: '',
    date_logic_type: 'dayOfMonthRange' as 'dayOfMonthRange' | 'ordinalInMonth',
    day_start: 1,
    day_end: 10,
    ordinal_position: 1,
    property_id: '',
    priority: 0,
    enabled: true,
  });

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [rulesResult, propsResult] = await Promise.all([
      supabase.from('advanced_rules').select('*').eq('user_id', user!.id).order('priority', { ascending: false }),
      supabase.from('properties').select('*').eq('user_id', user!.id).order('name'),
    ]);
    const props = propsResult.data || [];
    setRules((rulesResult.data || []).map(r => ({
      ...r,
      property_name: props.find(p => p.id === r.property_id)?.name,
    })));
    setProperties(props);
    setLoading(false);
  }

  function openForm(rule?: AdvancedRule) {
    if (rule) {
      setEditing(rule);
      setFormData({
        rule_name: rule.rule_name,
        description_match: rule.description_match,
        match_type: rule.match_type,
        provider_match: rule.provider_match || '',
        date_logic_type: rule.date_logic.type,
        day_start: rule.date_logic.start || 1,
        day_end: rule.date_logic.end || 10,
        ordinal_position: rule.date_logic.position || 1,
        property_id: rule.property_id || '',
        priority: rule.priority,
        enabled: rule.enabled,
      });
    } else {
      setEditing(null);
      setFormData({
        rule_name: '',
        description_match: '',
        match_type: 'contains',
        provider_match: '',
        date_logic_type: 'dayOfMonthRange',
        day_start: 1,
        day_end: 10,
        ordinal_position: 1,
        property_id: '',
        priority: 0,
        enabled: true,
      });
    }
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const dateLogic = formData.date_logic_type === 'dayOfMonthRange'
      ? { type: 'dayOfMonthRange' as const, start: formData.day_start, end: formData.day_end }
      : { type: 'ordinalInMonth' as const, position: formData.ordinal_position };

    const payload = {
      user_id: user!.id,
      rule_name: formData.rule_name,
      description_match: formData.description_match,
      match_type: formData.match_type,
      provider_match: formData.provider_match || null,
      date_logic: dateLogic,
      property_id: formData.property_id || null,
      priority: formData.priority,
      enabled: formData.enabled,
    };

    if (editing) {
      await supabase.from('advanced_rules').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('advanced_rules').insert(payload);
    }
    setShowForm(false);
    loadData();
  }

  async function deleteRule(id: string) {
    if (confirm('Delete this advanced rule?')) {
      await supabase.from('advanced_rules').delete().eq('id', id);
      loadData();
    }
  }

  async function toggleEnabled(rule: AdvancedRule) {
    await supabase.from('advanced_rules').update({ enabled: !rule.enabled }).eq('id', rule.id);
    loadData();
  }

  function formatDateLogic(logic: AdvancedRule['date_logic']) {
    if (logic.type === 'dayOfMonthRange') {
      return `Days ${logic.start}-${logic.end}`;
    }
    const suffix = logic.position === 1 ? 'st' : logic.position === 2 ? 'nd' : logic.position === 3 ? 'rd' : 'th';
    return `${logic.position}${suffix} occurrence`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Advanced Rules</h2>
        <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <p className="text-neutral-500 text-sm">
        Advanced rules disambiguate transactions with identical descriptions using date-based logic. 
        These are evaluated BEFORE standard categorization rules.
      </p>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No advanced rules yet</p>
          <button onClick={() => openForm()} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
            Create Your First Rule
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-neutral-500">Active</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-500">Name</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-500">Pattern</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-500">Date Logic</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-500">Property</th>
                <th className="px-3 py-2 text-center font-medium text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2">
                    <button onClick={() => toggleEnabled(rule)}>
                      {rule.enabled ? <ToggleRight className="w-5 h-5 text-brand-500" /> : <ToggleLeft className="w-5 h-5 text-neutral-300" />}
                    </button>
                  </td>
                  <td className="px-3 py-2 font-medium text-neutral-900">{rule.rule_name}</td>
                  <td className="px-3 py-2 text-neutral-600 font-mono text-xs">
                    {rule.description_match}
                    <span className="text-neutral-400 ml-1">({rule.match_type})</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded">
                      {rule.date_logic.type === 'dayOfMonthRange' ? <Calendar className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
                      {formatDateLogic(rule.date_logic)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {rule.property_name ? (
                      <span className="px-2 py-1 text-xs bg-brand-50 text-brand-700 rounded">{rule.property_name}</span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openForm(rule)} className="p-1 text-neutral-500 hover:bg-neutral-100 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="p-1 text-semantic-error hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">{editing ? 'Edit Rule' : 'Add Advanced Rule'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={formData.rule_name}
                  onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g., Early Month Mortgage - Property A"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description Match *</label>
                <input
                  type="text"
                  required
                  value={formData.description_match}
                  onChange={(e) => setFormData({ ...formData, description_match: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g., MORTGAGE PAYMENT"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Match Type</label>
                <select
                  value={formData.match_type}
                  onChange={(e) => setFormData({ ...formData, match_type: e.target.value as 'contains' | 'exact' | 'regex' })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="contains">Contains</option>
                  <option value="exact">Exact</option>
                  <option value="regex">Regex</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Provider Match (optional)</label>
                <input
                  type="text"
                  value={formData.provider_match}
                  onChange={(e) => setFormData({ ...formData, provider_match: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g., bank_export.csv"
                />
              </div>

              <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
                <label className="block text-sm font-medium text-neutral-700">Date Logic *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.date_logic_type === 'dayOfMonthRange'}
                      onChange={() => setFormData({ ...formData, date_logic_type: 'dayOfMonthRange' })}
                      className="text-brand-500"
                    />
                    <span className="text-sm">Day Range</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.date_logic_type === 'ordinalInMonth'}
                      onChange={() => setFormData({ ...formData, date_logic_type: 'ordinalInMonth' })}
                      className="text-brand-500"
                    />
                    <span className="text-sm">Ordinal Position</span>
                  </label>
                </div>
                
                {formData.date_logic_type === 'dayOfMonthRange' ? (
                  <div className="flex gap-3 items-center">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Start Day</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={formData.day_start}
                        onChange={(e) => setFormData({ ...formData, day_start: parseInt(e.target.value) || 1 })}
                        className="w-20 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <span className="text-neutral-400 mt-5">to</span>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">End Day</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={formData.day_end}
                        onChange={(e) => setFormData({ ...formData, day_end: parseInt(e.target.value) || 31 })}
                        className="w-20 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Position (nth occurrence in month)</label>
                    <select
                      value={formData.ordinal_position}
                      onChange={(e) => setFormData({ ...formData, ordinal_position: parseInt(e.target.value) })}
                      className="w-32 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value={1}>1st</option>
                      <option value={2}>2nd</option>
                      <option value={3}>3rd</option>
                      <option value={4}>4th</option>
                      <option value={5}>5th</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Property *</label>
                <select
                  required
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select property</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Priority</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-neutral-500 mt-1">Higher priority rules are checked first</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 text-brand-500 border-neutral-300 rounded"
                />
                <label htmlFor="enabled" className="text-sm text-neutral-700">Enabled</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
                  {editing ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
