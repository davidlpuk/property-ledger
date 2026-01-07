-- Migration: Add company_logos table for logo caching
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS company_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  domain TEXT,
  last_fetched TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_name)
);

-- Enable RLS
ALTER TABLE company_logos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own logo cache" ON company_logos;
DROP POLICY IF EXISTS "Users can insert their own logo cache" ON company_logos;
DROP POLICY IF EXISTS "Users can update their own logo cache" ON company_logos;

-- Create policies
CREATE POLICY "Users can view their own logo cache"
  ON company_logos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logo cache"
  ON company_logos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logo cache"
  ON company_logos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logo cache"
  ON company_logos FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_logos_user_company
  ON company_logos(user_id, company_name);
