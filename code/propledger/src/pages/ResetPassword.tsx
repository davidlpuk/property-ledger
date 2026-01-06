import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ResetPassword() {
    const { user, loading } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);

    useEffect(() => {
        // Check if we're in a password reset flow
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsValidSession(true);
            }
        };
        checkSession();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Password Updated!</h2>
                    <p className="text-neutral-600 mb-6">Your password has been successfully reset.</p>
                    <a
                        href="/login"
                        className="inline-block py-3 px-6 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors"
                    >
                        Back to Sign In
                    </a>
                </div>
            </div>
        );
    }

    if (!isValidSession) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-900 mb-2">Invalid Reset Link</h2>
                    <p className="text-neutral-600 mb-6">This password reset link is invalid or has expired.</p>
                    <a
                        href="/login"
                        className="inline-block py-3 px-6 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors"
                    >
                        Request New Link
                    </a>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setSubmitting(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate password strength
    const getPasswordStrength = (pwd: string) => {
        let strength = 0;
        if (pwd.length >= 6) strength++;
        if (pwd.length >= 10) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        if (/[^A-Za-z0-9]/.test(pwd)) strength++;
        return Math.min(strength, 4);
    };

    const passwordStrength = getPasswordStrength(password);
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 relative overflow-hidden">
            <img
                src="https://cdn.mxpnl.com/marketing-site/static/_next/static/media/gradient.91e052ed.png"
                className="absolute bottom-0 left-0 w-full pointer-events-none"
                alt=""
            />
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-brand-500 mb-2">PropLedger</h1>
                    <p className="text-neutral-500">Set your new password</p>
                </div>
                <div className="bg-white rounded-xl shadow-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                placeholder="Min 6 characters"
                                autoComplete="new-password"
                            />
                            {password.length > 0 && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-colors ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-neutral-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        Password strength: <span className={passwordStrength >= 3 ? 'text-green-600' : passwordStrength >= 2 ? 'text-yellow-600' : 'text-red-600'}>{strengthLabels[passwordStrength]}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-semantic-error bg-red-50 p-3 rounded-lg">{error}</div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Updating...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
