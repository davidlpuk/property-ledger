-- Add missing columns if they don't exist
DO $$ BEGIN
    CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        type TEXT CHECK (type IN ('income', 'expense')),
        is_default BOOLEAN DEFAULT FALSE,
        iva_rate DECIMAL(5,2) DEFAULT 0,
        is_deductible BOOLEAN DEFAULT TRUE,
        icon TEXT,
        colour TEXT,
        sort_order INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns via ALTER TABLE if table exists but columns are missing
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS colour TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE categories ALTER COLUMN user_id DROP NOT NULL;
