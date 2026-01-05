CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('income',
    'expense')),
    is_default BOOLEAN DEFAULT FALSE,
    iva_rate DECIMAL(5,2) DEFAULT 0,
    is_deductible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);