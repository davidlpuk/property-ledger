-- Migration: update_categories_hierarchy
-- Created at: 1767552127


ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS colour TEXT DEFAULT '#6366f1';
;