CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    property_id UUID,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    contract_start DATE,
    contract_end DATE,
    monthly_rent DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);