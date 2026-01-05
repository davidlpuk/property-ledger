import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Plus, X, Tag, ArrowRight, Check } from 'lucide-react';

interface PropertyDraft {
  name: string;
  keywords: string[];
}

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [properties, setProperties] = useState<PropertyDraft[]>([]);
  const [currentProperty, setCurrentProperty] = useState({ name: '', keywords: '' });
  const [saving, setSaving] = useState(false);

  const addProperty = () => {
    if (!currentProperty.name.trim()) return;
    const keywords = currentProperty.keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);
    setProperties([...properties, { name: currentProperty.name.trim(), keywords }]);
    setCurrentProperty({ name: '', keywords: '' });
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Insert properties
      if (properties.length > 0) {
        const propertyData = properties.map(p => ({
          user_id: user.id,
          name: p.name,
          keywords: p.keywords,
          is_stressed_zone: false,
          is_occupied: false,
        }));
        await supabase.from('properties').insert(propertyData);
      }

      // Mark onboarding complete
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        onboarding_completed: true,
      });

      onComplete();
    } catch (e) {
      console.error('Onboarding error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s === step ? 'bg-brand-500' : s < step ? 'bg-brand-300' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Welcome to PropLedger</h1>
            <p className="text-neutral-600 mb-8">
              Let's set up your rental properties. You can add more details later.
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Add Your Properties</h2>
            <p className="text-neutral-600 mb-6 text-sm">
              Add keywords to auto-associate transactions (e.g., "Madrid" matches transactions mentioning Madrid)
            </p>

            {/* Property List */}
            {properties.length > 0 && (
              <div className="space-y-3 mb-6">
                {properties.map((prop, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900">{prop.name}</p>
                      {prop.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prop.keywords.map((kw, ki) => (
                            <span key={ki} className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-100 text-brand-700 text-xs rounded">
                              <Tag className="w-3 h-3" /> {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeProperty(idx)}
                      className="p-1 text-neutral-400 hover:text-semantic-error transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Property Form */}
            <div className="space-y-3 p-4 border border-neutral-200 rounded-lg mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Property Name</label>
                <input
                  type="text"
                  value={currentProperty.name}
                  onChange={(e) => setCurrentProperty({ ...currentProperty, name: e.target.value })}
                  placeholder="e.g., Apartment in Madrid"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={currentProperty.keywords}
                  onChange={(e) => setCurrentProperty({ ...currentProperty, keywords: e.target.value })}
                  placeholder="e.g., madrid, calle mayor, apt1"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Transactions containing these keywords will auto-associate
                </p>
              </div>
              <button
                type="button"
                onClick={addProperty}
                disabled={!currentProperty.name.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-brand-500 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Add Property
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={completeOnboarding}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? (
                  <>Saving...</>
                ) : properties.length === 0 ? (
                  <>Skip for Now</>
                ) : (
                  <><Check className="w-4 h-4" /> Complete Setup</>
                )}
              </button>
            </div>
            {properties.length === 0 && (
              <p className="text-xs text-neutral-500 text-center mt-3">
                You can add properties later from the Properties page
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
