import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, invokeEdgeFunction } from '../../lib/supabase';
import { Trash2, Download, X, Check, Loader2, ChevronRight, Database } from 'lucide-react';

type DeleteStep = 'warning' | 'processing' | 'confirm' | 'success';

export function DeleteAccountSection() {
    const { user, signOut } = useAuth();
    const [step, setStep] = useState<DeleteStep>('warning');
    const [confirmText, setConfirmText] = useState('');
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
            // Fetch all user data
            const userId = user!.id;

            // Fetch data from all tables
            const [properties, transactions, categories, rules, budgets, bankAccounts, profiles, tenants] = await Promise.all([
                supabase.from('properties').select('*').eq('user_id', userId),
                supabase.from('transactions').select('*').eq('user_id', userId),
                supabase.from('categories').select('*').eq('user_id', userId),
                supabase.from('categorisation_rules').select('*').eq('user_id', userId),
                supabase.from('budgets').select('*').eq('user_id', userId),
                supabase.from('bank_accounts').select('*').eq('user_id', userId),
                supabase.from('profiles').select('*').eq('id', userId).single(),
                supabase.from('tenants').select('*').eq('user_id', userId),
            ]);

            // Compile all data
            const exportData = {
                exportDate: new Date().toISOString(),
                userEmail: user?.email,
                profiles: profiles.data,
                properties: properties.data || [],
                transactions: transactions.data || [],
                categories: categories.data || [],
                categorisationRules: rules.data || [],
                budgets: budgets.data || [],
                bankAccounts: bankAccounts.data || [],
                tenants: tenants.data || [],
            };

            // Create and trigger download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `property-ledger-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Update export timestamp
            await supabase
                .from('profiles')
                .update({ last_data_export_at: new Date().toISOString() })
                .eq('id', userId);

            // Refresh the export date from database to ensure UI updates
            await checkLastExportDate();
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
        return true; // Export is now optional
    };

    const handleInitiateDelete = async () => {
        setLoading(true);
        setError(null);

        try {
            // Call the delete account API with proper error handling
            const { data, error: apiError } = await invokeEdgeFunction('delete-account', {
                body: {},
            });

            if (apiError) {
                console.error('Delete API Error:', apiError, 'Response data:', data);
                // Use the response data as the error message if available
                const errorData = data as { error?: string; message?: string };
                const errorMessage = errorData?.error || errorData?.message || apiError.message || 'Failed to delete account. Please try again.';
                throw new Error(errorMessage);
            }

            console.log('Delete response:', data);

            // Wait a moment to show processing state
            await new Promise(resolve => setTimeout(resolve, 2000));

            setStep('success');

            // Sign out after showing success
            setTimeout(() => {
                signOut();
            }, 3000);
        } catch (err: any) {
            console.error('Delete error:', err);
            // Show more detailed error message
            const errorMessage = err.message || err.error_description || 'Failed to delete account. Please try again.';
            setError(errorMessage);
            setLoading(false);
        }
    };

    const renderWarningStep = () => (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Data Management</h3>
                    <p className="text-neutral-600 mt-1">
                        Manage your account data and optionally export it before making changes.
                    </p>
                </div>
            </div>

            {/* Prerequisites Check */}
            <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-neutral-900">Account Status:</h4>

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

                {/* Export Section - Optional */}
                <div className="pt-2">
                    <p className="text-sm text-neutral-600 mb-2">
                        Want to backup your data before making changes? (Optional)
                    </p>
                    <button
                        onClick={handleExportData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Export My Data
                    </button>
                    {lastExportDate && (
                        <p className="text-xs text-neutral-500 mt-2">
                            Last exported: {new Date(lastExportDate).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Next Button */}
            <button
                onClick={() => setStep('confirm')}
                disabled={!canDelete()}
                className="w-full py-3 px-4 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    onClick={handleInitiateDelete}
                    disabled={confirmText.toLowerCase() !== user?.email?.toLowerCase() || loading}
                    className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Deleting...
                        </>
                    ) : (
                        <>
                            <Trash2 className="w-4 h-4" />
                            Delete My Account
                        </>
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
                <h2 className="text-lg font-semibold text-neutral-900">Data Management</h2>
                <p className="text-sm text-neutral-500 mt-1">
                    Manage and export your account data
                </p>
            </div>

            <div className="p-6">
                {step === 'warning' && renderWarningStep()}
                {step === 'confirm' && renderConfirmStep()}
                {step === 'processing' && renderProcessingStep()}
                {step === 'success' && renderSuccessStep()}
            </div>
        </div>
    );
}
