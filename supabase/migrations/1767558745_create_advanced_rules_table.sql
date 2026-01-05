-- Migration: create_advanced_rules_table
-- Created at: 1767558745

CREATE TABLE advanced_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  rule_name TEXT NOT NULL,
  description_match TEXT NOT NULL,
  match_type TEXT DEFAULT 'contains',
  provider_match TEXT,
  date_logic JSONB NOT NULL,
  property_id UUID REFERENCES properties,
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE advanced_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own advanced_rules" ON advanced_rules
  FOR ALL USING (auth.uid() = user_id);;