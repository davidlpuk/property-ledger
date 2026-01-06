-- Migration: Add deletion status fields to profiles table
-- This enables soft delete functionality with 7-day grace period

-- Add status column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deletion_pending', 'deleted'));

-- Add deletion tracking columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_deadline TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_data_export_at TIMESTAMPTZ;

-- Create index for efficient querying of deletion-pending users
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_pending 
ON profiles(status) WHERE status = 'deletion_pending';

CREATE INDEX IF NOT EXISTS idx_profiles_deletion_deadline 
ON profiles(deletion_deadline) 
WHERE status = 'deletion_pending';

-- Create churn feedback table for tracking reasons for leaving
CREATE TABLE IF NOT EXISTS churn_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user feedback queries
CREATE INDEX IF NOT EXISTS idx_churn_feedback_user_id ON churn_feedback(user_id);

-- Create subscriptions table (for Stripe integration)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create function for hard deletion cron job
-- This function should be called by a scheduled task (pg_cron or similar)
CREATE OR REPLACE FUNCTION perform_hard_deletion()
RETURNS void AS $$
DECLARE
    pending_user RECORD;
    deleted_count INTEGER := 0;
BEGIN
    -- Loop through users past their deletion deadline
    FOR pending_user IN 
        SELECT id, email FROM profiles 
        WHERE status = 'deletion_pending' 
        AND deletion_deadline <= NOW()
    LOOP
        -- Anonymize user's personal data (for shared data references)
        UPDATE properties 
        SET owner_id = NULL, 
            owner_name = 'Deleted User',
            updated_at = NOW()
        WHERE owner_id = pending_user.id;

        UPDATE transactions 
        SET user_id = NULL,
            notes = '[Account deleted]',
            updated_at = NOW()
        WHERE user_id = pending_user.id;

        -- Log the hard deletion
        RAISE NOTICE 'Hard deleting user: %', pending_user.id;
        deleted_count := deleted_count + 1;
    END LOOP;

    -- Clean up fully deleted users
    DELETE FROM profiles WHERE status = 'deletion_pending' AND deletion_deadline <= NOW();
    
    RAISE NOTICE 'Hard deletion complete. Processed % users.', deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to undo deletion (restore account)
CREATE OR REPLACE FUNCTION undo_deletion(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET status = 'active',
        deletion_requested_at = NULL,
        deletion_deadline = NULL,
        updated_at = NOW()
    WHERE id = user_id AND status = 'deletion_pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can delete account
CREATE OR REPLACE FUNCTION can_delete_account(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_active_sub BOOLEAN;
    has_recent_export BOOLEAN;
    user_status TEXT;
BEGIN
    -- Check user status
    SELECT status INTO user_status FROM profiles WHERE id = user_id;
    IF user_status != 'active' THEN
        RETURN FALSE;
    END IF;

    -- Check for active subscriptions
    SELECT EXISTS (
        SELECT 1 FROM subscriptions 
        WHERE user_id = user_id AND status = 'active'
    ) INTO has_active_sub;

    IF has_active_sub THEN
        RETURN FALSE;
    END IF;

    -- Check for recent data export (within 24 hours)
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND last_data_export_at >= NOW() - INTERVAL '24 hours'
    ) INTO has_recent_export;

    RETURN has_recent_export;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for new tables
ALTER TABLE churn_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Churn feedback: users can only see their own feedback
CREATE POLICY "Users can view own churn feedback" ON churn_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own churn feedback" ON churn_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions: users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles with soft delete support';
COMMENT ON COLUMN profiles.status IS 'Account status: active, deletion_pending, or deleted';
COMMENT ON COLUMN profiles.deletion_requested_at IS 'When the user requested deletion';
COMMENT ON COLUMN profiles.deletion_deadline IS 'When the hard deletion will occur (7 days after request)';
COMMENT ON COLUMN profiles.last_data_export_at IS 'When the user last exported their data';

COMMENT ON TABLE churn_feedback IS 'Optional feedback from users who delete their accounts';
COMMENT ON TABLE subscriptions IS 'Stripe subscription tracking for billing integration';

COMMENT ON FUNCTION perform_hard_deletion() IS 'Cron job function to permanently delete accounts past their deadline';
COMMENT ON FUNCTION undo_deletion(UUID) IS 'Restores a deletion-pending account to active status';
COMMENT ON FUNCTION can_delete_account(UUID) IS 'Checks if a user meets all prerequisites for account deletion';
