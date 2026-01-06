import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface DeleteAccountRequest {
    reason?: string;
    feedback?: string;
}

serve(async (req: Request) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // Create Supabase client with service role key
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Get the authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Verify the user's session
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Parse request body
        const { reason, feedback } = await req.json() as DeleteAccountRequest;

        // Check if user already has a pending deletion
        const { data: existingProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('status, deletion_requested_at')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('[DELETE_ACCOUNT] Error fetching profile:', profileError);
        }

        if (existingProfile?.status === 'deletion_pending') {
            return new Response(JSON.stringify({
                error: 'Account deletion is already pending',
                deletion_requested_at: existingProfile.deletion_requested_at
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check for active subscriptions (optional - may not exist)
        try {
            const { data: subscriptions } = await supabaseAdmin
                .from('subscriptions')
                .select('id, status')
                .eq('user_id', user.id)
                .eq('status', 'active');

            if (subscriptions && subscriptions.length > 0) {
                // Cancel active subscriptions
                for (const sub of subscriptions) {
                    await supabaseAdmin
                        .from('subscriptions')
                        .update({
                            status: 'cancelled',
                            cancel_at_period_end: true,
                            cancelled_at: new Date().toISOString()
                        })
                        .eq('id', sub.id);
                }
            }
        } catch (subError) {
            // Subscriptions table may not exist - skip this step
            console.log('[DELETE_ACCOUNT] Subscriptions check skipped - table may not exist');
        }

        // Store churn feedback (optional - may not exist)
        if (reason || feedback) {
            try {
                await supabaseAdmin.from('churn_feedback').insert({
                    user_id: user.id,
                    reason,
                    feedback,
                    created_at: new Date().toISOString(),
                });
            } catch (feedbackError) {
                // Churn feedback table may not exist - skip this step
                console.log('[DELETE_ACCOUNT] Churn feedback skipped - table may not exist');
            }
        }

        // Initiate soft delete
        const deletionDeadline = new Date();
        deletionDeadline.setDate(deletionDeadline.getDate() + 7); // 7-day grace period

        await supabaseAdmin
            .from('profiles')
            .update({
                status: 'deletion_pending',
                deletion_requested_at: new Date().toISOString(),
                deletion_deadline: deletionDeadline.toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        // Invalidate all active sessions
        await supabaseAdmin.auth.admin.deleteUser(user.id);

        // Log the deletion request
        console.log(`[DELETE_ACCOUNT] Deletion initiated for user ${user.id}`);
        console.log(`[DELETE_ACCOUNT] Deletion deadline: ${deletionDeadline.toISOString()}`);
        console.log(`[DELETE_ACCOUNT] Reason: ${reason || 'Not provided'}`);
        console.log(`[DELETE_ACCOUNT] Feedback: ${feedback || 'Not provided'}`);

        return new Response(JSON.stringify({
            success: true,
            message: 'Account deletion initiated',
            deletion_deadline: deletionDeadline.toISOString(),
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('[DELETE_ACCOUNT] Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
