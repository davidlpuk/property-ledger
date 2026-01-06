CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deletion_pending', 'deleted')),
    deletion_requested_at TIMESTAMPTZ,
    deletion_deadline TIMESTAMPTZ,
    last_data_export_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_pending 
ON profiles(status) WHERE status = 'deletion_pending';

CREATE INDEX IF NOT EXISTS idx_profiles_deletion_deadline 
ON profiles(deletion_deadline) WHERE status = 'deletion_pending';
