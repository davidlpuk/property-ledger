-- Migration: fix_categories_rls
-- Created at: 1767546519

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

-- Allow all authenticated users to view all categories (including defaults)
CREATE POLICY "Users can view all categories" ON categories
  FOR SELECT USING (true);

-- Allow users to insert their own categories
CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update their own categories
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to delete their own categories (not defaults)
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);;