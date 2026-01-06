import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Category, Property } from '../lib/types';
import { formatCurrency } from '../lib/format';
import {
    PieChart, BarChart as BarChartIcon, Download, Filter,
    Calendar as CalendarIcon, ChevronDown, ArrowUpDown, X
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Cell, Pie
} from 'recharts';

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string | number;
    onClick?: (data: any) => void;
    filterByCategory?: (categoryId: string) => void;
}

// LocalStorage key for filter persistence
const FILTERS_STORAGE_KEY = 'propledger_reports_filters';

interface SavedFilters {
    selectedYear: number;
    selectedMonth: number | 'all';
    selectedProperty: string;
    selectedCategory: string;
}

// Default filters
const defaultFilters: SavedFilters = {
    selectedYear: new Date().getFullYear(),
    selectedMonth: 'all',
    selectedProperty: 'all',
    selectedCategory: 'all'
};

function getSavedFilters(): SavedFilters {
    try {
        const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...defaultFilters, ...parsed };
        }
    } catch (e) {
        console.warn('Failed to load saved filters:', e);
    }
    return defaultFilters;
}

function saveFilters(filters: SavedFilters) {
    try {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
        console.warn('Failed to save filters:', e);
    }
}

export function Reports() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);

    // Load saved filters on mount
    const savedFilters = useMemo(() => getSavedFilters(), []);

    // Filters - initialize from saved or default
    const [selectedYear, setSelectedYear] = useState<number>(savedFilters.selectedYear);
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(savedFilters.selectedMonth);
    const [selectedProperty, setSelectedProperty] = useState<string>(savedFilters.selectedProperty);
    const [selectedCategory, setSelectedCategory] = useState<string>(savedFilters.selectedCategory);

    // Active filter summary for UI
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    // Save filters when they change
    useEffect(() => {
        saveFilters({ selectedYear, selectedMonth, selectedProperty, selectedCategory });
    }, [selectedYear, selectedMonth, selectedProperty, selectedCategory]);

    // Update active filters summary
    useEffect(() => {
        const filters: string[] = [];
        if (selectedYear !== defaultFilters.selectedYear) {
            filters.push(`Year: ${selectedYear}`);
        }
        if (selectedMonth !== 'all') {
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            filters.push(`Month: ${monthNames[selectedMonth as number]}`);
        }
        if (selectedProperty !== 'all') {
            const prop = properties.find(p => p.id === selectedProperty);
            filters.push(`Property: ${prop?.name || selectedProperty}`);
        }
        if (selectedCategory !== 'all') {
            const cat = categories.find(c => c.id === selectedCategory);
            filters.push(`Category: ${cat?.name || selectedCategory}`);
        }
        setActiveFilters(filters);
    }, [selectedYear, selectedMonth, selectedProperty, selectedCategory, properties, categories]);

    // Sorting
    const [sortField, setSortField] = useState<'name' | 'income' | 'expense' | 'net'>('expense');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: 'name' | 'income' | 'expense' | 'net') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc'); // Default to high-to-low for numbers usually
        }
    };

    const SortIcon = ({ field }: { field: 'name' | 'income' | 'expense' | 'net' }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-neutral-300 ml-1 inline" />;
        return sortDirection === 'asc'
            ? <ChevronDown className="w-3 h-3 text-brand-600 ml-1 inline rotate-180" />
            : <ChevronDown className="w-3 h-3 text-brand-600 ml-1 inline" />;
    };

    useEffect(() => {
        async function loadData() {
            if (!user) return;
            setLoading(true);

            const [txRes, catRes, propRes] = await Promise.all([
                supabase.from('transactions').select('*').eq('user_id', user.id).neq('status', 'excluded'),
                supabase.from('categories').select('*'),
                supabase.from('properties').select('*').eq('user_id', user.id)
            ]);

            if (txRes.data) setTransactions(txRes.data);
            if (catRes.data) setCategories(catRes.data);
            if (propRes.data) setProperties(propRes.data);

            setLoading(false);
        }
        loadData();
    }, [user]);

    // Aggregation Logic
    const filteredData = useMemo(() => {
        return transactions.filter(tx => {
            const date = new Date(tx.date);
            const matchesYear = date.getFullYear() === selectedYear;
            const matchesMonth = selectedMonth === 'all' || date.getMonth() === selectedMonth;
            const matchesProperty = selectedProperty === 'all' || tx.property_id === selectedProperty;
            const matchesCategory = selectedCategory === 'all' || tx.category_id === selectedCategory;

            return matchesYear && matchesMonth && matchesProperty && matchesCategory;
        });
    }, [transactions, selectedYear, selectedMonth, selectedProperty, selectedCategory]);

    const financials = useMemo(() => {
        let income = 0;
        let expense = 0;

        filteredData.forEach(tx => {
            const amount = Number(tx.amount);
            if (tx.type === 'income') income += amount;
            else expense += Math.abs(amount); // Ensure expense is positive for display
        });

        return {
            income,
            expense,
            net: income - expense,
            margin: income > 0 ? ((income - expense) / income) * 100 : 0
        };
    }, [filteredData]);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Financial Reports</h1>
                    <p className="text-neutral-500 text-sm">Overview of your property performance</p>
                </div>

                {/* Time Controls */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-neutral-200 shadow-sm">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-3 py-1.5 text-sm font-medium text-neutral-700 bg-transparent border-none rounded hover:bg-neutral-50 focus:ring-0 cursor-pointer"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <div className="w-px h-4 bg-neutral-200"></div>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-3 py-1.5 text-sm font-medium text-neutral-700 bg-transparent border-none rounded hover:bg-neutral-50 focus:ring-0 cursor-pointer"
                    >
                        <option value="all">Entire Year</option>
                        {monthNames.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Financial Snapshot Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SnapshotCard
                    label="Total Income"
                    value={financials.income}
                    type="income"
                />
                <SnapshotCard
                    label="Total Expenses"
                    value={financials.expense}
                    type="expense"
                />
                <SnapshotCard
                    label="Net Income"
                    value={financials.net}
                    type={financials.net >= 0 ? 'positive' : 'negative'}
                />
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                    <div className="text-sm text-neutral-500 mb-1 font-medium">Profit Margin</div>
                    <div className={`text-2xl font-bold ${financials.margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {financials.margin.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Secondary Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <select
                        value={selectedProperty}
                        onChange={(e) => setSelectedProperty(e.target.value)}
                        className="pl-9 pr-8 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">All Properties</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <Filter className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="pl-9 pr-8 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <PieChart className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {(selectedProperty !== 'all' || selectedCategory !== 'all') && (
                    <button
                        onClick={() => { setSelectedProperty('all'); setSelectedCategory('all'); }}
                        className="text-sm text-neutral-500 hover:text-neutral-900 underline"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Income vs Expense Chart (Main) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-neutral-900">
                            {selectedMonth === 'all' ? 'Monthly Performance' : 'Daily Performance'}
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={generateChartData(filteredData, selectedMonth, monthNames)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#737373' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#737373' }}
                                    tickFormatter={(val) => `£${val / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f5f5f5' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown (Donut/List?) - Keeping it simple list as per requirements 'Category Report' with Table logic */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col">
                    <h3 className="font-semibold text-neutral-900 mb-4">Top Expenses</h3>
                    <div className="flex-1 overflow-auto">
                        <CategoryMiniList
                            transactions={filteredData.filter(t => t.type === 'expense')}
                            categories={categories}
                        />
                    </div>
                </div>
            </div>

            {/* Detailed Category Report Table */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
                    <h3 className="font-semibold text-neutral-900">Category Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                            <tr>
                                <th onClick={() => handleSort('name')} className="px-6 py-3 cursor-pointer hover:bg-neutral-100 transition-colors">
                                    Category <SortIcon field="name" />
                                </th>
                                <th onClick={() => handleSort('income')} className="px-6 py-3 text-right cursor-pointer hover:bg-neutral-100 transition-colors text-emerald-600">
                                    Income <SortIcon field="income" />
                                </th>
                                <th onClick={() => handleSort('expense')} className="px-6 py-3 text-right cursor-pointer hover:bg-neutral-100 transition-colors text-rose-600">
                                    Expenses <SortIcon field="expense" />
                                </th>
                                <th onClick={() => handleSort('net')} className="px-6 py-3 text-right cursor-pointer hover:bg-neutral-100 transition-colors text-neutral-900">
                                    Net <SortIcon field="net" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {generateCategoryRows(filteredData, categories, sortField, sortDirection).map((row) => (
                                <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-neutral-700">{row.name}</td>
                                    <td className="px-6 py-3 text-right text-emerald-600 tabular-nums">{formatCurrency(row.income)}</td>
                                    <td className="px-6 py-3 text-right text-rose-600 tabular-nums">{formatCurrency(row.expense)}</td>
                                    <td className="px-6 py-3 text-right font-medium tabular-nums text-neutral-900">
                                        {formatCurrency(row.net)}
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                                        No data available for the selected period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Stats Card Component
function SnapshotCard({ label, value, type }: { label: string, value: number, type: 'income' | 'expense' | 'positive' | 'negative' }) {
    let colorClass = 'text-neutral-900';
    if (type === 'income' || type === 'positive') colorClass = 'text-emerald-600';
    if (type === 'expense' || type === 'negative') colorClass = 'text-rose-600';

    return (
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <div className="text-sm text-neutral-500 mb-1 font-medium">{label}</div>
            <div className={`text-2xl font-bold ${colorClass}`}>
                {formatCurrency(value)}
            </div>
        </div>
    );
}

// Helpers
function generateChartData(transactions: Transaction[], selectedMonth: number | 'all', monthNames: string[]) {
    if (selectedMonth === 'all') {
        // Group by Month
        const data = Array.from({ length: 12 }, (_, i) => ({
            name: monthNames[i].substring(0, 3),
            Income: 0,
            Expenses: 0,
            monthIndex: i
        }));

        transactions.forEach(tx => {
            const m = new Date(tx.date).getMonth();
            if (tx.type === 'income') data[m].Income += Number(tx.amount);
            else data[m].Expenses += Math.abs(Number(tx.amount));
        });
        return data;
    } else {
        // Group by Day (or maybe Category? The prompt says "Grouped by Month (when year selected) / Category ...")
        // "View by Category" is a toggle. For now default to Month view.
        // If a specific month is selected, easier to show weekly or daily? 
        // Let's simple aggregation by week or just disable chart granularity for now and show categories. 
        // Prompt says: "Grouped by Month (when year selected)"
        // If month selected, maybe show daily?
        // Let's implement Daily for selected month.

        // Get days in month
        // Just map transactions to days?
        // Let's effectively return daily sum.
        const daysInMonth = 31; // Simplification
        const data = Array.from({ length: daysInMonth }, (_, i) => ({
            name: `${i + 1}`,
            Income: 0,
            Expenses: 0
        }));
        transactions.forEach(tx => {
            const d = new Date(tx.date).getDate() - 1;
            if (d >= 0 && d < 31) {
                if (tx.type === 'income') data[d].Income += Number(tx.amount);
                else data[d].Expenses += Math.abs(Number(tx.amount));
            }
        });
        return data;
    }
}

function CategoryMiniList({ transactions, categories }: { transactions: Transaction[], categories: Category[] }) {
    const totals = transactions.reduce((acc, tx) => {
        const id = tx.category_id || 'uncategorized';
        acc[id] = (acc[id] || 0) + Math.abs(Number(tx.amount));
        return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(totals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5

    return (
        <div className="space-y-3">
            {sorted.map(([catId, amount]) => {
                const cat = categories.find(c => c.id === catId);
                return (
                    <div key={catId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                            <span className="text-neutral-700 font-medium truncate max-w-[120px]">
                                {cat ? cat.name : 'Uncategorized'}
                            </span>
                        </div>
                        <span className="text-neutral-600">{formatCurrency(amount)}</span>
                    </div>
                )
            })}
            {sorted.length === 0 && <p className="text-sm text-neutral-400">No expenses recorded</p>}
        </div>
    )
}

function generateCategoryRows(
    transactions: Transaction[],
    categories: Category[],
    sortField: 'name' | 'income' | 'expense' | 'net' = 'expense',
    sortDirection: 'asc' | 'desc' = 'desc'
) {
    const stats = new Map<string, { income: number; expense: number }>();

    // Initialize with all categories so they show up even if empty? 
    // Prompt: "Empty states: 'No expenses recorded for this category'" -> suggests keeping them?
    // "Grouped by Category Breakdown... matches filters"
    // Usually better to show active ones or all? 
    // Let's show all categories that have data + maybe non-empty?
    // Or just all categories from the `categories` array.

    categories.forEach(c => {
        stats.set(c.id, { income: 0, expense: 0 });
    });
    stats.set('uncategorized', { income: 0, expense: 0 });

    transactions.forEach(tx => {
        const cid = tx.category_id || 'uncategorized';
        const curr = stats.get(cid) || { income: 0, expense: 0 }; // fallback if category deleted
        if (tx.type === 'income') curr.income += Number(tx.amount);
        else curr.expense += Math.abs(Number(tx.amount));
        stats.set(cid, curr);
    });

    return Array.from(stats.entries())
        .map(([id, val]) => {
            const cat = categories.find(c => c.id === id);
            return {
                id,
                name: cat ? cat.name : (id === 'uncategorized' ? 'Uncategorized' : 'Unknown'),
                income: val.income,
                expense: val.expense,
                net: val.income - val.expense
            };
        })
        .filter(row => row.income !== 0 || row.expense !== 0) // Only show active rows
        .sort((a, b) => {
            let res = 0;
            if (sortField === 'name') {
                res = a.name.localeCompare(b.name);
            } else if (sortField === 'income') {
                res = a.income - b.income;
            } else if (sortField === 'expense') {
                res = a.expense - b.expense;
            } else if (sortField === 'net') {
                res = a.net - b.net;
            }
            return sortDirection === 'asc' ? res : -res;
        });
}


