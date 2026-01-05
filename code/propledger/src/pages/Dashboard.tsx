import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/format';
import { Transaction, Property, Category, Budget } from '../lib/types';
import { TrendingUp, TrendingDown, Building2, AlertCircle, ArrowRight, PieChart, BarChart3, Upload, X, Sparkles } from 'lucide-react';
import { DateRangePicker } from '../components/DateRangePicker';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Type workaround for recharts with React 18
const PieComponent = Pie as any;
const TooltipComponent = Tooltip as any;
const LegendComponent = Legend as any;
const XAxisComponent = XAxis as any;
const YAxisComponent = YAxis as any;
const BarComponent = Bar as any;



const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  
  // Initialize date range to current month
  const [dateStart, setDateStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [profile, setProfile] = useState<{ display_name?: string; full_name?: string } | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    const [txResult, propResult, catResult, budgetResult, profileResult] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user!.id).order('date', { ascending: false }),
      supabase.from('properties').select('*').eq('user_id', user!.id),
      supabase.from('categories').select('*'),
      supabase.from('budgets').select('*').eq('user_id', user!.id).eq('is_active', true),
      supabase.from('profiles').select('display_name, full_name').eq('id', user!.id).single(),
    ]);
    setTransactions(txResult.data || []);
    setProperties(propResult.data || []);
    setCategories(catResult.data || []);
    setBudgets(budgetResult.data || []);
    setProfile(profileResult.data);
    setLoading(false);
    
    // Show welcome modal for first-time users (no transactions)
    const hasSeenWelcome = localStorage.getItem('propledger_welcome_seen');
    if (!hasSeenWelcome && (txResult.data || []).length === 0) {
      setShowWelcomeModal(true);
    }
  }

  // Use date range from state
  const dateRange = useMemo(() => ({
    start: dateStart,
    end: dateEnd
  }), [dateStart, dateEnd]);

  const handleDateRangeChange = (start: string, end: string) => {
    setDateStart(start);
    setDateEnd(end);
  };

  // Previous period for comparison
  const prevDateRange = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const duration = end.getTime() - start.getTime();
    
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    
    return { start: prevStart.toISOString().split('T')[0], end: prevEnd.toISOString().split('T')[0] };
  }, [dateRange]);

  // Filter transactions
  const filteredTxs = useMemo(() => {
    return transactions.filter(tx => {
      if (tx.status === 'excluded') return false;
      if (tx.date < dateRange.start || tx.date > dateRange.end) return false;
      if (selectedProperty && tx.property_id !== selectedProperty) return false;
      return true;
    });
  }, [transactions, dateRange, selectedProperty]);

  const prevPeriodTxs = useMemo(() => {
    return transactions.filter(tx => {
      if (tx.status === 'excluded') return false;
      if (tx.date < prevDateRange.start || tx.date > prevDateRange.end) return false;
      if (selectedProperty && tx.property_id !== selectedProperty) return false;
      return true;
    });
  }, [transactions, prevDateRange, selectedProperty]);

  // KPIs
  const kpis = useMemo(() => {
    const expenses = filteredTxs.filter(t => t.type === 'expense');
    const prevExpenses = prevPeriodTxs.filter(t => t.type === 'expense');
    
    const totalSpend = expenses.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    const prevTotalSpend = prevExpenses.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    const changePercent = prevTotalSpend > 0 ? ((totalSpend - prevTotalSpend) / prevTotalSpend) * 100 : 0;
    
    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(tx => {
      const catId = tx.category_id || 'uncategorized';
      categoryTotals[catId] = (categoryTotals[catId] || 0) + Math.abs(Number(tx.amount));
    });
    
    const largestCategoryId = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0];
    const largestCategory = largestCategoryId === 'uncategorized' 
      ? 'Uncategorized' 
      : categories.find(c => c.id === largestCategoryId)?.name || 'Unknown';
    
    const uncategorizedCount = expenses.filter(t => !t.category_id).length;
    
    const totalIncome = filteredTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    const netIncome = totalIncome - totalSpend;
    
    return {
      totalSpend,
      changePercent,
      largestCategory,
      uncategorizedCount,
      totalIncome,
      netIncome,
    };
  }, [filteredTxs, prevPeriodTxs, categories]);

  // Chart data - Spend by category (donut)
  const categoryChartData = useMemo(() => {
    const expenses = filteredTxs.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, { value: number; id: string }> = {};
    
    expenses.forEach(tx => {
      const cat = categories.find(c => c.id === tx.category_id);
      const name = cat?.name || 'Uncategorized';
      const id = cat?.id || '__uncategorised__';
      if (!categoryTotals[name]) categoryTotals[name] = { value: 0, id };
      categoryTotals[name].value += Math.abs(Number(tx.amount));
    });
    
    return Object.entries(categoryTotals)
      .map(([name, data]) => ({ name, value: data.value, id: data.id }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTxs, categories]);

  // Top 10 categories for bar chart
  const top10Categories = useMemo(() => {
    return categoryChartData.slice(0, 10);
  }, [categoryChartData]);

  // Top 8 for donut chart
  const donutChartData = useMemo(() => {
    return categoryChartData.slice(0, 8);
  }, [categoryChartData]);

  

  // Budget alerts
  const budgetAlerts = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    
    return budgets.map(b => {
      const relevantTxs = filteredTxs.filter(t => {
        if (t.type !== 'expense') return false;
        if (b.category_id && t.category_id !== b.category_id) return false;
        if (b.property_id && t.property_id !== b.property_id) return false;
        return true;
      });
      
      const spent = relevantTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      const percentage = (spent / Number(b.amount)) * 100;
      
      return {
        ...b,
        category_name: categories.find(c => c.id === b.category_id)?.name || 'All Categories',
        spent,
        percentage,
      };
    }).filter(b => b.percentage >= b.alert_threshold * 100);
  }, [budgets, filteredTxs, categories]);

  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const handleWelcomeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // Navigate to transactions page with file - let that page handle the upload
    localStorage.setItem('propledger_welcome_seen', 'true');
    setShowWelcomeModal(false);
    navigate('/transactions');
  };

  const dismissWelcome = () => {
    localStorage.setItem('propledger_welcome_seen', 'true');
    setShowWelcomeModal(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Modal for First-Time Users */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in">
            <button
              onClick={dismissWelcome}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-brand-500" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Welcome to PropLedger!</h2>
              <p className="text-neutral-600 mb-6">
                Upload your first bank statement to get started organizing your property finances.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleWelcomeUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <Upload className="w-5 h-5" />
                Upload Bank Statement
              </button>
              <button
                onClick={dismissWelcome}
                className="text-neutral-500 hover:text-neutral-700 text-sm"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Welcome back, {profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'User'}
          </h1>
          <p className="text-neutral-500 mt-1">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} in portfolio
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Property Filter */}
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Properties</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          {/* Date Range Picker */}
          <DateRangePicker
            startDate={dateStart}
            endDate={dateEnd}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-500">Total Spend</span>
            {kpis.changePercent !== 0 && (
              kpis.changePercent > 0 ? (
                <TrendingUp className="w-5 h-5 text-semantic-error" />
              ) : (
                <TrendingDown className="w-5 h-5 text-semantic-success" />
              )
            )}
          </div>
          <p className="text-2xl font-bold text-neutral-900 font-mono">{formatCurrency(kpis.totalSpend)}</p>
          {kpis.changePercent !== 0 && (
            <p className={`text-sm mt-1 ${kpis.changePercent > 0 ? 'text-semantic-error' : 'text-semantic-success'}`}>
              {kpis.changePercent > 0 ? '+' : ''}{kpis.changePercent.toFixed(1)}% vs prev period
            </p>
          )}
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-500">Net Income</span>
            {kpis.netIncome >= 0 ? (
              <TrendingUp className="w-5 h-5 text-semantic-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-semantic-error" />
            )}
          </div>
          <p className={`text-2xl font-bold font-mono ${kpis.netIncome >= 0 ? 'text-semantic-success' : 'text-semantic-error'}`}>
            {formatCurrency(kpis.netIncome)}
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-500">Uncategorized</span>
            <AlertCircle className={`w-5 h-5 ${kpis.uncategorizedCount > 0 ? 'text-amber-500' : 'text-neutral-300'}`} />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{kpis.uncategorizedCount}</p>
          {kpis.uncategorizedCount > 0 && (
            <Link to="/transactions?status=pending" className="text-sm text-brand-500 hover:text-brand-600">
              Review now
            </Link>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Spend by Category */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Spend by Category</h2>
            <PieChart className="w-5 h-5 text-neutral-400" />
          </div>
          {donutChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <PieComponent
                    data={donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(data: any) => {
                      const catId = data.id || data.payload?.id;
                      const params = new URLSearchParams();
                      if (catId) params.set('category', catId);
                      if (selectedProperty) params.set('property', selectedProperty);
                      navigate(`/transactions?${params.toString()}`);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {donutChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </PieComponent>
                  <TooltipComponent formatter={(value: number) => formatCurrency(value)} />
                  <LegendComponent />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-neutral-400">
              No expense data for this period
            </div>
          )}
        </div>

        {/* Bar Chart - Top 10 Categories */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Top 10 Categories</h2>
            <BarChart3 className="w-5 h-5 text-neutral-400" />
          </div>
          {top10Categories.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10Categories} layout="vertical">
                    <XAxisComponent type="number" tickFormatter={(v: number) => formatCurrency(v)} />
                    <YAxisComponent type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <TooltipComponent formatter={(value: number) => formatCurrency(value)} />
                    <BarComponent 
                      dataKey="value" 
                      fill="#6366f1" 
                      radius={[0, 4, 4, 0]}
                      onClick={(data: any) => {
                        const catId = data.id || data.payload?.id;
                        const params = new URLSearchParams();
                        if (catId) params.set('category', catId);
                        if (selectedProperty) params.set('property', selectedProperty);
                        navigate(`/transactions?${params.toString()}`);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {categoryChartData.length > 10 && (
                <button
                  onClick={() => setShowAllCategories(true)}
                  className="mt-4 w-full py-2 text-sm text-brand-500 hover:text-brand-600 font-medium flex items-center justify-center gap-1"
                >
                  View all {categoryChartData.length} categories
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-neutral-400">
              No expense data for this period
            </div>
          )}
        </div>
      </div>

      {/* All Categories Modal */}
      {showAllCategories && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 className="text-xl font-bold text-neutral-900">All Categories</h2>
              <button
                onClick={() => setShowAllCategories(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div style={{ height: Math.min(categoryChartData.length * 40, 500) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical">
                    <XAxisComponent type="number" tickFormatter={(v: number) => formatCurrency(v)} />
                    <YAxisComponent type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                    <TooltipComponent formatter={(value: number) => formatCurrency(value)} />
                    <BarComponent 
                      dataKey="value" 
                      fill="#6366f1" 
                      radius={[0, 4, 4, 0]}
                      onClick={(data: any) => {
                        const catId = data.id || data.payload?.id;
                        const params = new URLSearchParams();
                        if (catId) params.set('category', catId);
                        if (selectedProperty) params.set('property', selectedProperty);
                        setShowAllCategories(false);
                        navigate(`/transactions?${params.toString()}`);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-3">Budget Alerts</h3>
          <div className="space-y-2">
            {budgetAlerts.map(b => (
              <div key={b.id} className="flex items-center justify-between">
                <span className="text-amber-700">
                  {b.category_name}: {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                </span>
                <span className={`text-sm font-medium ${b.percentage >= 100 ? 'text-red-600' : 'text-amber-600'}`}>
                  {Math.round(b.percentage)}%
                </span>
              </div>
            ))}
          </div>
          <Link to="/budgets" className="inline-block mt-3 text-sm text-amber-700 hover:text-amber-800 font-medium">
            View all budgets
          </Link>
        </div>
      )}

      {/* Pending Review */}
      {pendingCount > 0 && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-brand-500" />
            <span className="text-sm font-medium text-brand-700">
              {pendingCount} transaction{pendingCount !== 1 ? 's' : ''} pending categorization
            </span>
          </div>
          <Link
            to="/transactions?status=pending"
            className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            Review <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Transactions</h2>
          <Link to="/transactions" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
            View all
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <p>No transactions yet.</p>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="text-brand-500 hover:text-brand-600 mt-2 inline-block"
              >
                Upload bank statement
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <div>
                    <p className="font-medium text-neutral-900">{tx.description || 'No description'}</p>
                    <p className="text-sm text-neutral-500">{new Date(tx.date).toLocaleDateString('es-ES')}</p>
                  </div>
                  <p className={`font-mono font-medium ${tx.type === 'income' ? 'text-semantic-success' : 'text-neutral-700'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(tx.amount)))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
