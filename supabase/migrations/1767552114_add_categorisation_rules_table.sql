-- Migration: add_categorisation_rules_table
-- Created at: 1767552114


CREATE TABLE categorisation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains', 'starts_with', 'ends_with', 'regex', 'exact')),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categorisation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rules" ON categorisation_rules
  FOR ALL USING (auth.uid() = user_id);
;