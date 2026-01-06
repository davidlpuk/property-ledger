import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Navigate, useSearchParams } from 'react-router-dom';

export function Login() {
  const { user, signIn, signUp, resetPassword, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isSignUp && password.length === 0) {
      setError('Please enter your password');
      return;
    }

    setSubmitting(true);

    try {
      if (showResetPassword) {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setResetSent(true);
        }
      } else {
        const { error } = isSignUp
          ? await signUp(email, password)
          : await signIn(email, password);
        if (error) {
          setError(error.message);
        } else if (isSignUp) {
          setSignupSuccess(true);
        } else {
          // Handle remember me
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const signInWithGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        setError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          <p className="text-neutral-500">Bank transaction management for Spanish landlords</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-8">
          {resetSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Reset Email Sent!</h2>
              <p className="text-neutral-600 mb-4">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="text-sm text-neutral-500 mb-6">Check your inbox and follow the link to reset your password.</p>
              <button
                onClick={() => { setResetSent(false); setShowResetPassword(false); }}
                className="text-brand-500 hover:text-brand-600 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          ) : signupSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Account Created!</h2>
              <p className="text-neutral-600 mb-4">Please check your email to verify your account.</p>
              <p className="text-sm text-neutral-500">Once verified, you can sign in below.</p>
              <button
                onClick={() => { setSignupSuccess(false); setIsSignUp(false); }}
                className="mt-6 text-brand-500 hover:text-brand-600 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">
                {showResetPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
              </h2>

              {!showResetPassword && (
                <>
                  <button
                    onClick={signInWithGoogle}
                    disabled={submitting}
                    className="w-full py-3 px-4 border border-neutral-200 rounded-lg flex items-center justify-center gap-3 hover:bg-neutral-50 transition-colors disabled:opacity-50 mb-4"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-neutral-700 font-medium">Continue with Google</span>
                  </button>

                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-neutral-500">or</span>
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="maria@example.com"
                    autoComplete="email"
                  />
                </div>

                {!showResetPassword && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                      <input
                        type={isSignUp ? 'password' : 'password'}
                        value={password}
                        onChange={handlePasswordChange}
                        required={!showResetPassword}
                        minLength={6}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        placeholder="Min 6 characters"
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      />
                      {isSignUp && password.length > 0 && (
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

                    {!isSignUp && (
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500"
                          />
                          <span className="text-sm text-neutral-600">Remember me</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => { setShowResetPassword(true); setError(''); }}
                          className="text-sm text-brand-500 hover:text-brand-600"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </>
                )}

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
                      Processing...
                    </>
                  ) : (
                    showResetPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setShowResetPassword(false);
                    setError('');
                  }}
                  className="text-sm text-brand-500 hover:text-brand-600"
                >
                  {isSignUp ? 'Already have an account? Sign in' : !showResetPassword && "Don't have an account? Sign up"}
                </button>
              </div>

              {showResetPassword && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => { setShowResetPassword(false); setError(''); }}
                    className="text-sm text-neutral-500 hover:text-brand-500"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              )}

              <div className="mt-4 text-center">
                <a
                  href="/demo"
                  className="text-sm text-neutral-500 hover:text-brand-500 inline-flex items-center gap-1"
                >
                  <span>🎮</span> Try demo mode (no login required)
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
