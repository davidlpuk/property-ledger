import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Onboarding } from './components/Onboarding';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { supabase } from './lib/supabase';

// Lazy load heavy pages for code-splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Transactions = React.lazy(() => import('./pages/Transactions').then(m => ({ default: m.Transactions })));
const Taxes = React.lazy(() => import('./pages/Taxes').then(m => ({ default: m.Taxes })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

// Lazy load settings sub-sections
const PropertiesSection = React.lazy(() => import('./components/settings/PropertiesSection').then(m => ({ default: m.PropertiesSection })));
const BankAccountsSection = React.lazy(() => import('./components/settings/BankAccountsSection').then(m => ({ default: m.BankAccountsSection })));
const RulesSection = React.lazy(() => import('./components/settings/RulesSection').then(m => ({ default: m.RulesSection })));
const BudgetsSection = React.lazy(() => import('./components/settings/BudgetsSection').then(m => ({ default: m.BudgetsSection })));
const TenantsSection = React.lazy(() => import('./components/settings/TenantsSection').then(m => ({ default: m.TenantsSection })));
const CategoriesSection = React.lazy(() => import('./components/settings/CategoriesSection').then(m => ({ default: m.CategoriesSection })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }
      const { data } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();
      
      setNeedsOnboarding(!data?.onboarding_completed);
      setCheckingOnboarding(false);
    }
    if (!loading) checkOnboarding();
  }, [user, loading]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={() => setNeedsOnboarding(false)} />;
  }

  return <Layout>{children}</Layout>;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/taxes"
              element={
                <ProtectedRoute>
                  <Taxes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="properties" replace />} />
              <Route path="properties" element={<PropertiesSection />} />
              <Route path="bank-accounts" element={<BankAccountsSection />} />
              <Route path="rules" element={<RulesSection />} />
              <Route path="budgets" element={<BudgetsSection />} />
              <Route path="tenants" element={<TenantsSection />} />
              <Route path="categories" element={<CategoriesSection />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
