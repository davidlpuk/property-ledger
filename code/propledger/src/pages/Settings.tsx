import React, { useState } from 'react';
import { Building2, Landmark, Wand2, PiggyBank, Users, Tag, Calendar, User, ChevronDown, AlertTriangle } from 'lucide-react';

// Import section components
import { PropertiesSection } from '../components/settings/PropertiesSection';
import { BankAccountsSection } from '../components/settings/BankAccountsSection';
import { RulesSection } from '../components/settings/RulesSection';
import { BudgetsSection } from '../components/settings/BudgetsSection';
import { TenantsSection } from '../components/settings/TenantsSection';
import { CategoriesSection } from '../components/settings/CategoriesSection';
import { AdvancedRulesSection } from '../components/settings/AdvancedRulesSection';
import { ProfileSection } from '../components/settings/ProfileSection';
import { DeleteAccountSection } from '../components/settings/DeleteAccountSection';

type SettingsTab = 'profile' | 'properties' | 'bank-accounts' | 'rules' | 'advanced-rules' | 'budgets' | 'tenants' | 'categories' | 'danger';

const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'properties', label: 'Properties', icon: Building2 },
  { key: 'bank-accounts', label: 'Bank Accounts', icon: Landmark },
  { key: 'rules', label: 'Rules', icon: Wand2 },
  { key: 'advanced-rules', label: 'Advanced Rules', icon: Calendar },
  { key: 'budgets', label: 'Budgets', icon: PiggyBank },
  { key: 'tenants', label: 'Tenants', icon: Users },
  { key: 'categories', label: 'Categories', icon: Tag },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTabData = tabs.find(t => t.key === activeTab);
  const ActiveIcon = activeTabData?.icon || User;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />;
      case 'properties':
        return <PropertiesSection />;
      case 'bank-accounts':
        return <BankAccountsSection />;
      case 'rules':
        return <RulesSection />;
      case 'advanced-rules':
        return <AdvancedRulesSection />;
      case 'budgets':
        return <BudgetsSection />;
      case 'tenants':
        return <TenantsSection />;
      case 'categories':
        return <CategoriesSection />;
      case 'danger':
        return <DeleteAccountSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Settings</h1>

      {/* Mobile Tab Selector */}
      <div className="md:hidden mb-4">
        <div className="relative">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl shadow-card text-sm font-medium text-neutral-900"
          >
            <div className="flex items-center gap-3">
              <ActiveIcon className="w-5 h-5 text-brand-500" />
              {activeTabData?.label}
            </div>
            <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-neutral-200 z-20 py-2 max-h-80 overflow-y-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${isActive
                        ? 'bg-brand-50 text-brand-600'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Left Sidebar - Hidden on mobile */}
        <nav className="hidden md:block w-56 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-card p-2 sticky top-24">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}

            {/* Danger Zone Section */}
            <div className="border-t border-neutral-200 mt-2 pt-2">
              <button
                onClick={() => setActiveTab('danger')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'danger'
                    ? 'bg-red-50 text-red-600'
                    : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  }`}
              >
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </button>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
