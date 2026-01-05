-- Migration: add_keywords_and_notes_columns
-- Created at: 1767544090

-- Add keywords column to properties for auto-association
ALTER TABLE properties ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

-- Add notes column to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add onboarding_completed to user profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    CREATE TABLE user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      onboarding_completed BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id)
    );
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;;