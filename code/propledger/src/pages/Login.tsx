import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';

export function Login() {
  const { user, signIn, signUp, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

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
    setSubmitting(true);

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);
      if (error) {
        setError(error.message);
      } else if (isSignUp) {
        setSignupSuccess(true);
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
          {signupSuccess ? (
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
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Min 6 characters"
              />
            </div>
            {error && (
              <div className="text-sm text-semantic-error bg-red-50 p-3 rounded-lg">{error}</div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-brand-500 hover:text-brand-600"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
