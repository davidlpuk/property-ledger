import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User, Check, Loader2 } from 'lucide-react';

interface ProfileData {
  full_name: string;
  display_name: string;
  phone: string;
  company_name: string;
  tax_id: string;
}

export function ProfileSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    display_name: '',
    phone: '',
    company_name: '',
    tax_id: '',
  });

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  async function loadProfile() {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('full_name, display_name, phone, company_name, tax_id')
      .eq('user_id', user!.id)
      .single();
    
    if (data) {
      setFormData({
        full_name: data.full_name || '',
        display_name: data.display_name || '',
        phone: data.phone || '',
        company_name: data.company_name || '',
        tax_id: data.tax_id || '',
      });
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: formData.full_name || null,
        display_name: formData.display_name || null,
        phone: formData.phone || null,
        company_name: formData.company_name || null,
        tax_id: formData.tax_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user!.id);
    
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
      </div>
      <p className="text-neutral-500 text-sm">
        Manage your personal information and business details.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-6 space-y-5">
        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500 cursor-not-allowed"
          />
          <p className="text-xs text-neutral-400 mt-1">Email cannot be changed</p>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="John Doe"
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Display Name</label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="John"
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-neutral-400 mt-1">How you'd like to be addressed</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Phone (optional)</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+34 612 345 678"
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Company / Business Name (optional)</label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="Acme Properties SL"
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Tax ID / NIF */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Tax ID / NIF (optional)</label>
          <input
            type="text"
            value={formData.tax_id}
            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            placeholder="12345678A"
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-neutral-400 mt-1">Used for tax reports</p>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              saved
                ? 'bg-semantic-success text-white'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            } disabled:opacity-50`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
