import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../lib/format';
import { Property } from '../../lib/types';
import { Plus, Building2, MapPin, Calendar, X, Edit2, Trash2, Tag } from 'lucide-react';

export function PropertiesSection() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    cadastral_ref: '',
    acquisition_date: '',
    acquisition_cost: '',
    construction_value: '',
    is_stressed_zone: false,
    is_occupied: false,
    keywords: '',
    color: '#6366f1',
    is_default: false,
  });

  useEffect(() => {
    if (user) loadProperties();
  }, [user]);

  async function loadProperties() {
    setLoading(true);
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user!.id)
      .order('name', { ascending: true });
    setProperties(data || []);
    setLoading(false);
  }

  function openForm(prop?: Property) {
    if (prop) {
      setEditingProp(prop);
      setFormData({
        name: prop.name,
        address: prop.address || '',
        cadastral_ref: prop.cadastral_ref || '',
        acquisition_date: prop.acquisition_date || '',
        acquisition_cost: prop.acquisition_cost?.toString() || '',
        construction_value: prop.construction_value?.toString() || '',
        is_stressed_zone: prop.is_stressed_zone,
        is_occupied: prop.is_occupied,
        keywords: (prop.keywords || []).join(', '),
        color: prop.color || '#6366f1',
        is_default: prop.is_default || false,
      });
    } else {
      setEditingProp(null);
      setFormData({
        name: '', address: '', cadastral_ref: '', acquisition_date: '',
        acquisition_cost: '', construction_value: '', is_stressed_zone: false,
        is_occupied: false, keywords: '', color: '#6366f1', is_default: false,
      });
    }
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const keywords = formData.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
    const payload = {
      user_id: user!.id,
      name: formData.name,
      address: formData.address || null,
      cadastral_ref: formData.cadastral_ref || null,
      acquisition_date: formData.acquisition_date || null,
      acquisition_cost: formData.acquisition_cost ? parseFloat(formData.acquisition_cost) : null,
      construction_value: formData.construction_value ? parseFloat(formData.construction_value) : null,
      is_stressed_zone: formData.is_stressed_zone,
      is_occupied: formData.is_occupied,
      keywords,
      color: formData.color,
      is_default: formData.is_default,
    };
    if (editingProp) {
      await supabase.from('properties').update(payload).eq('id', editingProp.id);
    } else {
      await supabase.from('properties').insert(payload);
    }
    setShowForm(false);
    loadProperties();
  }

  async function deleteProperty(id: string) {
    if (confirm('Are you sure you want to delete this property?')) {
      await supabase.from('properties').delete().eq('id', id);
      loadProperties();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Properties</h2>
        <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <Building2 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No properties yet</p>
          <button onClick={() => openForm()} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
            Add Your First Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {properties.map((prop) => (
            <div key={prop.id} className="bg-white rounded-xl shadow-card p-5 hover:shadow-hover transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: prop.color || '#6366f1' }} />
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: prop.color || '#6366f1' }} />
                    <h3 className="font-semibold text-neutral-900">
                      {prop.name}
                      {prop.is_default && <span className="ml-2 text-xs text-brand-500">(Default)</span>}
                    </h3>
                  </div>
                  {prop.address && (
                    <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1 ml-5">
                      <MapPin className="w-3 h-3" /> {prop.address}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${prop.is_occupied ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                  {prop.is_occupied ? 'Occupied' : 'Vacant'}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                {prop.acquisition_date && (
                  <p className="text-neutral-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(prop.acquisition_date)}
                  </p>
                )}
                {prop.acquisition_cost && (
                  <p className="text-neutral-700 font-medium">{formatCurrency(prop.acquisition_cost)}</p>
                )}
                {prop.keywords && prop.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {prop.keywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">
                        <Tag className="w-3 h-3" /> {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-100">
                <button onClick={() => openForm(prop)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => deleteProperty(prop.id)} className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-semantic-error hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-modal w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">{editingProp ? 'Edit Property' : 'Add Property'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5 text-neutral-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g., Apartment in Madrid" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Keywords (comma-separated)</label>
                <input type="text" value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g., madrid, calle mayor" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Acquisition Date</label>
                  <input type="date" value={formData.acquisition_date} onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Acquisition Cost</label>
                  <input type="number" step="0.01" value={formData.acquisition_cost} onChange={(e) => setFormData({ ...formData, acquisition_cost: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-10 h-10 border border-neutral-200 rounded cursor-pointer" />
                    <span className="text-sm text-neutral-500">{formData.color}</span>
                  </div>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.is_default} onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })} className="w-4 h-4 text-brand-500 border-neutral-300 rounded focus:ring-brand-500" />
                    <span className="text-sm text-neutral-700">Default Property</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_stressed_zone} onChange={(e) => setFormData({ ...formData, is_stressed_zone: e.target.checked })} className="w-4 h-4 text-brand-500 border-neutral-300 rounded focus:ring-brand-500" />
                  <span className="text-sm text-neutral-700">Zona Tensionada</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_occupied} onChange={(e) => setFormData({ ...formData, is_occupied: e.target.checked })} className="w-4 h-4 text-brand-500 border-neutral-300 rounded focus:ring-brand-500" />
                  <span className="text-sm text-neutral-700">Currently Occupied</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">{editingProp ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
