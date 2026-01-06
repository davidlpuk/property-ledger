import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Trash2, Download, X, Check, Loader2, ChevronRight } from 'lucide-react';

type DeleteStep = 'warning' | 'feedback' | 'processing' | 'confirm' | 'success';

const LEAVING_REASONS = [
    { id: 'expensive', label: 'Too expensive' },
    { id: 'missing_features', label: 'Missing features I need' },
    { id: 'switched', label: 'Switched to another app' },
    { id: 'not_use', label: 'Don\'t use it enough' },
    { id: 'bugs', label: 'Too many bugs or issues' },
    { id: 'other', label: 'Other' },
];

export function DeleteAccountSection() {
    const { user, signOut } = useAuth();
    const [step, setStep] = useState<DeleteStep>('warning');
    const [confirmText, setConfirmText] = useState('');
    const [selectedReason, setSelectedReason] = useState('');
    const [feedbackText, setFeedbackText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const [lastExportDate, setLastExportDate] = useState<string | null>(null);
    const [showExportReminder, setShowExportReminder] = useState(false);

    useEffect(() => {
        if (user) {
            checkSubscriptionStatus();
            checkLastExportDate();
        }
    }, [user]);

    const checkSubscriptionStatus = async () => {
        // Check for active subscriptions (mock - replace with actual Stripe check)
        const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select('id, status')
            .eq('user_id', user!.id)
            .eq('status', 'active');

        setHasActiveSubscription((subscriptions?.length || 0) > 0);
    };

    const checkLastExportDate = async () => {
        // Check when user last exported their data
        const { data: profile } = await supabase
            .from('profiles')
            .select('last_data_export_at')
            .eq('id', user!.id)
            .single();

        setLastExportDate(profile?.last_data_export_at || null);
    };

    const handleExportData = async () => {
        setLoading(true);
        try {
            // Trigger data export
            const { error } = await supabase
                .from('profiles')
                .update({ last_data_export_at: new Date().toISOString() })
                .eq('id', user!.id);

            if (error) throw error;

            setLastExportDate(new Date().toISOString());
            setShowExportReminder(false);
        } catch (err) {
            console.error('Export error:', err);
            setError('Failed to export data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const canDelete = () => {
        if (hasActiveSubscription) return false;
        if (!lastExportDate) return false;

        // Check if export was within last 24 hours
        const exportTime = new Date(lastExportDate).getTime();
        const now = Date.now();
        const hoursSinceExport = (now - exportTime) / (1000 * 60 * 60);

        return hoursSinceExport < 24;
    };

    const handleInitiateDelete = async () => {
        setLoading(true);
        setError(null);

        try {
            // Call the delete account API
            const { data, error: apiError } = await supabase.functions.invoke('delete-account', {
                body: {
                    reason: selectedReason,
                    feedback: feedbackText,
                },
            });

            if (apiError) throw apiError;

            setStep('processing');

            // Wait a moment to show processing state
            await new Promise(resolve => setTimeout(resolve, 2000));

            setStep('success');

            // Sign out after showing success
            setTimeout(() => {
                signOut();
            }, 3000);
        } catch (err: any) {
            console.error('Delete error:', err);
            setError(err.message || 'Failed to initiate account deletion. Please try again.');
            setLoading(false);
        }
    };

    const renderWarningStep = () => (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Delete Account and Data</h3>
                    <p className="text-neutral-600 mt-1">
                        This action is permanent and cannot be undone. All your property data, transactions, and settings will be permanently removed.
                    </p>
                </div>
            </div>

            {/* Prerequisites Check */}
            <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-neutral-900">Before you proceed:</h4>

                {/* Subscription Check */}
                <div className="flex items-center gap-3">
                    {hasActiveSubscription ? (
                        <>
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                                <X className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-amber-700">You have an active subscription. Please cancel it first.</span>
                        </>
                    ) : (
                        <>
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-green-700">No active subscriptions</span>
                        </>
                    )}
                </div>

                {/* Export Check */}
                <div className="flex items-center gap-3">
                    {canDelete() ? (
                        <>
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-green-700">Data export completed within 24 hours</span>
                        </>
                    ) : (
                        <>
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                                <X className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-amber-700">
                                {lastExportDate
                                    ? 'Data export expired. Please export again.'
                                    : 'Data export required before deletion.'}
                            </span>
                        </>
                    )}
                </div>

                {/* Export Button */}
                {!canDelete() && (
                    <button
                        onClick={handleExportData}
                        disabled={loading}
                        className="mt-2 flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Export My Data
                    </button>
                )}
            </div>

            {/* Next Button */}
            <button
                onClick={() => setStep('confirm')}
                disabled={!canDelete()}
                className="w-full py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                Continue to Confirmation
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );

    const renderConfirmStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Are you absolutely sure?</h3>
                <p className="text-neutral-600 mt-2">
                    This will permanently delete your account and all associated data. This action cannot be reversed.
                </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">What will be deleted:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                    <li>• All property information and details</li>
                    <li>• Transaction history and records</li>
                    <li>• Categories, rules, and budgets</li>
                    <li>• Bank account connections</li>
                    <li>• Tenant information</li>
                    <li>• All settings and preferences</li>
                </ul>
            </div>

            {/* Email Confirmation Input */}
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Type <span className="font-mono bg-neutral-100 px-1 rounded">{user?.email}</span> to confirm
                </label>
                <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={() => {
                        setStep('warning');
                        setConfirmText('');
                    }}
                    className="flex-1 py-3 px-4 border border-neutral-200 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => setStep('feedback')}
                    disabled={confirmText.toLowerCase() !== user?.email?.toLowerCase()}
                    className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continue
                </button>
            </div>
        </div>
    );

    const renderFeedbackStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-neutral-900">One last thing...</h3>
                <p className="text-neutral-600 mt-2">
                    We'd love to know why you're leaving. This is completely optional and helps us improve.
                </p>
            </div>

            <div className="space-y-2">
                {LEAVING_REASONS.map((reason) => (
                    <button
                        key={reason.id}
                        onClick={() => setSelectedReason(reason.id)}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${selectedReason === reason.id
                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                            }`}
                    >
                        {reason.label}
                    </button>
                ))}
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Additional feedback (optional)
                </label>
                <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us more about what we could have done better..."
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => setStep('confirm')}
                    className="flex-1 py-3 px-4 border border-neutral-200 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                >
                    Skip
                </button>
                <button
                    onClick={handleInitiateDelete}
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        'Delete My Account'
                    )}
                </button>
            </div>
        </div>
    );

    const renderProcessingStep = () => (
        <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">Processing your request...</h3>
            <p className="text-neutral-600 mt-2">
                Your account deletion has been initiated. You will receive a confirmation email shortly.
            </p>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">Account Deletion Initiated</h3>
            <p className="text-neutral-600 mt-2">
                Your account has been marked for deletion. You have <strong>7 days</strong> to cancel this process by clicking the "Undo" link in your confirmation email.
            </p>
            <p className="text-sm text-neutral-500 mt-4">
                You will be signed out automatically. Thank you for using PropLedger.
            </p>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
                <h2 className="text-lg font-semibold text-neutral-900">Danger Zone</h2>
                <p className="text-sm text-neutral-500 mt-1">
                    Irreversible actions for your account
                </p>
            </div>

            <div className="p-6">
                {step === 'warning' && renderWarningStep()}
                {step === 'confirm' && renderConfirmStep()}
                {step === 'feedback' && renderFeedbackStep()}
                {step === 'processing' && renderProcessingStep()}
                {step === 'success' && renderSuccessStep()}
            </div>
        </div>
    );
}
