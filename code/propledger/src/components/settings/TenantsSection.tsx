import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../lib/format';
import { Tenant, Property } from '../../lib/types';
import { Plus, Users, X, Edit2, Trash2, Phone, Mail } from 'lucide-react';

export function TenantsSection() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', property_id: '', contract_start: '', contract_end: '', monthly_rent: '', deposit_amount: '' });

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [tenantResult, propResult] = await Promise.all([
      supabase.from('tenants').select('*').eq('user_id', user!.id).order('name'),
      supabase.from('properties').select('*').eq('user_id', user!.id).order('name'),
    ]);
    const props = propResult.data || [];
    setTenants((tenantResult.data || []).map(t => ({ ...t, property_name: props.find(p => p.id === t.property_id)?.name })));
    setProperties(props);
    setLoading(false);
  }

  function openForm(tenant?: Tenant) {
    if (tenant) { setEditing(tenant); setFormData({ name: tenant.name, email: tenant.email || '', phone: tenant.phone || '', property_id: tenant.property_id || '', contract_start: tenant.contract_start || '', contract_end: tenant.contract_end || '', monthly_rent: tenant.monthly_rent?.toString() || '', deposit_amount: tenant.deposit_amount?.toString() || '' }); }
    else { setEditing(null); setFormData({ name: '', email: '', phone: '', property_id: '', contract_start: '', contract_end: '', monthly_rent: '', deposit_amount: '' }); }
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { user_id: user!.id, name: formData.name, email: formData.email || null, phone: formData.phone || null, property_id: formData.property_id || null, contract_start: formData.contract_start || null, contract_end: formData.contract_end || null, monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : null, deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null };
    if (editing) await supabase.from('tenants').update(payload).eq('id', editing.id);
    else await supabase.from('tenants').insert(payload);
    setShowForm(false);
    loadData();
  }

  async function deleteTenant(id: string) { if (confirm('Delete this tenant?')) { await supabase.from('tenants').delete().eq('id', id); loadData(); } }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Tenants</h2>
        <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"><Plus className="w-4 h-4" /> Add Tenant</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No tenants yet</p>
          <button onClick={() => openForm()} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">Add Your First Tenant</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Tenant</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Property</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-500">Rent</th>
                <th className="px-4 py-3 text-center font-medium text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{tenant.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                      {tenant.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {tenant.email}</span>}
                      {tenant.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {tenant.phone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{tenant.property_name ? <span className="px-2 py-1 text-xs bg-brand-50 text-brand-700 rounded">{tenant.property_name}</span> : '-'}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium">{tenant.monthly_rent ? formatCurrency(tenant.monthly_rent) : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openForm(tenant)} className="p-1 text-neutral-500 hover:bg-neutral-100 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteTenant(tenant.id)} className="p-1 text-semantic-error hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold text-neutral-900">{editing ? 'Edit Tenant' : 'Add Tenant'}</h2><button onClick={() => setShowForm(false)} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5 text-neutral-500" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-neutral-700 mb-1">Property</label><select value={formData.property_id} onChange={(e) => setFormData({ ...formData, property_id: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Select property</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Contract Start</label><input type="date" value={formData.contract_start} onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Contract End</label><input type="date" value={formData.contract_end} onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Monthly Rent</label><input type="number" step="0.01" value={formData.monthly_rent} onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Deposit</label><input type="number" step="0.01" value={formData.deposit_amount} onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              </div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">{editing ? 'Save' : 'Add'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
