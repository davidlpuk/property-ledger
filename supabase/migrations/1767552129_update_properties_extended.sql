-- Migration: update_properties_extended
-- Created at: 1767552129


ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
;