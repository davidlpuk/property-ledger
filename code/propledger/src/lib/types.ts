export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface Property {
  id: string;
  user_id: string;
  name: string;
  address?: string;
  cadastral_ref?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
  construction_value?: number;
  is_stressed_zone: boolean;
  is_occupied: boolean;
  keywords?: string[];
  color?: string;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  user_id: string;
  property_id?: string;
  name: string;
  email?: string;
  phone?: string;
  contract_start?: string;
  contract_end?: string;
  monthly_rent?: number;
  deposit_amount?: number;
  created_at: string;
  updated_at: string;
  property_name?: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: 'income' | 'expense';
  is_default: boolean;
  iva_rate: number;
  is_deductible: boolean;
  parent_id?: string;
  icon?: string;
  colour?: string;
  created_at: string;
  children?: Category[];
}

export interface Transaction {
  id: string;
  user_id: string;
  property_id?: string;
  tenant_id?: string;
  category_id?: string;
  bank_account_id?: string;
  date: string;
  description?: string;
  description_clean?: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'pending' | 'posted' | 'excluded';
  source?: string;
  notes?: string;
  ai_category_suggestion?: string;
  ai_confidence?: number;
  is_recurring?: boolean;
  recurrence_group_id?: string;
  attachments?: Attachment[];
  hash?: string;
  created_at: string;
  updated_at: string;
  property_name?: string;
  category_name?: string;
  bank_account_name?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  bank_name?: string;
  default_property_id?: string;
  column_mappings?: Record<string, string>;
  created_at: string;
  updated_at: string;
  default_property_name?: string;
}

export interface CategorisationRule {
  id: string;
  user_id: string;
  name: string;
  pattern: string;
  match_type: 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'exact';
  category_id?: string;
  property_id?: string;
  priority: number;
  is_active: boolean;
  apply_globally: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
  property_name?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id?: string;
  property_id?: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
  property_name?: string;
  spent?: number;
  percentage?: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdvancedRule {
  id: string;
  user_id: string;
  rule_name: string;
  description_match: string;
  match_type: 'contains' | 'exact' | 'regex';
  provider_match?: string;
  date_logic: {
    type: 'dayOfMonthRange' | 'ordinalInMonth';
    start?: number;
    end?: number;
    position?: number;
  };
  property_id?: string;
  priority: number;
  enabled: boolean;
  created_at: string;
  property_name?: string;
}
