import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Category } from '../../lib/types';
import {
    Plus, Search, Edit2, Trash2, X, Check, Loader2, Tag,
    Grid, List, MoreVertical, Merge, Archive,
    Home, Briefcase, ShoppingCart, Car, Utensils, Heart,
    Lightbulb, Book, Plane, Phone, Wifi, Zap, Droplets,
    Building, Key, Wrench, Paintbrush, Dog, Baby,
    Gift, Music, Gamepad2, Camera, Code, DollarSign, TrendingUp,
    TrendingDown, CreditCard, Wallet, PiggyBank, Target,
    AlertCircle, CheckCircle2, Shield, FileText, Scale,
    Circle
} from 'lucide-react';

// ============================================================================
// Icon Options (unique labels to avoid React rendering bugs)
// ============================================================================
const ICON_OPTIONS = [
    { icon: Home, label: 'Home' },
    { icon: Briefcase, label: 'Work' },
    { icon: ShoppingCart, label: 'Shopping' },
    { icon: Car, label: 'Transport' },
    { icon: Utensils, label: 'Food' },
    { icon: Heart, label: 'Health' },
    { icon: Lightbulb, label: 'Utilities' },
    { icon: Book, label: 'Education' },
    { icon: Plane, label: 'Travel' },
    { icon: Phone, label: 'Phone' },
    { icon: Wifi, label: 'Internet' },
    { icon: Zap, label: 'Electricity' },
    { icon: Droplets, label: 'Water' },
    { icon: Building, label: 'Property' },
    { icon: Key, label: 'Rent' },
    { icon: Wrench, label: 'Maintenance' },
    { icon: Paintbrush, label: 'Decoration' },
    { icon: Dog, label: 'Pets' },
    { icon: Baby, label: 'Family' },
    { icon: Gift, label: 'Gifts' },
    { icon: Music, label: 'Entertainment' },
    { icon: Gamepad2, label: 'Hobbies' },
    { icon: Camera, label: 'Photography' },
    { icon: Code, label: 'Technology' },
    { icon: DollarSign, label: 'Money' },
    { icon: TrendingUp, label: 'Income' },
    { icon: TrendingDown, label: 'Expenses' },
    { icon: CreditCard, label: 'Credit' },
    { icon: PiggyBank, label: 'Savings' },
    { icon: Target, label: 'Goals' },
    { icon: Shield, label: 'Insurance' },
    { icon: Circle, label: 'Other' },
];

// ============================================================================
// Color Options (Tailwind-compatible colors)
// ============================================================================
const COLOR_OPTIONS = [
    { name: 'Emerald', class: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-600', bgLight: 'bg-emerald-50' },
    { name: 'Green', class: 'bg-green-500', border: 'border-green-500', text: 'text-green-600', bgLight: 'bg-green-50' },
    { name: 'Lime', class: 'bg-lime-500', border: 'border-lime-500', text: 'text-lime-600', bgLight: 'bg-lime-50' },
    { name: 'Amber', class: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-600', bgLight: 'bg-amber-50' },
    { name: 'Orange', class: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-50' },
    { name: 'Red', class: 'bg-red-500', border: 'border-red-500', text: 'text-red-600', bgLight: 'bg-red-50' },
    { name: 'Rose', class: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-600', bgLight: 'bg-rose-50' },
    { name: 'Pink', class: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-600', bgLight: 'bg-pink-50' },
    { name: 'Fuchsia', class: 'bg-fuchsia-500', border: 'border-fuchsia-500', text: 'text-fuchsia-600', bgLight: 'bg-fuchsia-50' },
    { name: 'Purple', class: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-600', bgLight: 'bg-purple-50' },
    { name: 'Violet', class: 'bg-violet-500', border: 'border-violet-500', text: 'text-violet-600', bgLight: 'bg-violet-50' },
    { name: 'Indigo', class: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-600', bgLight: 'bg-indigo-50' },
    { name: 'Blue', class: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-50' },
    { name: 'Sky', class: 'bg-sky-500', border: 'border-sky-500', text: 'text-sky-600', bgLight: 'bg-sky-50' },
    { name: 'Cyan', class: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-600', bgLight: 'bg-cyan-50' },
    { name: 'Teal', class: 'bg-teal-500', border: 'border-teal-500', text: 'text-teal-600', bgLight: 'bg-teal-50' },
];

// ============================================================================
// Extended Category Interface (with usage data)
// ============================================================================
interface CategoryWithUsage extends Category {
    usage_count: number;
    last_used?: string;
    transaction_count: number;
}

interface MergeOperation {
    sourceId: string;
    targetId: string;
}

// ============================================================================
// Icon Picker Component
// ============================================================================
function IconPicker({
    selectedIcon,
    onSelect,
    isOpen,
    onClose
}: {
    selectedIcon?: string;
    onSelect: (iconName: string) => void;
    isOpen: boolean;
    onClose: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="absolute z-50 mt-2 p-3 bg-white rounded-xl shadow-lg border border-neutral-200 w-72 max-h-64 overflow-y-auto" >
            <div className="flex items-center justify-between mb-2" >
                <span className="text-sm font-medium text-neutral-700" > Choose Icon </span>
                < button onClick={onClose} className="text-neutral-400 hover:text-neutral-600" >
                    <X className="w-4 h-4" />
                </button>
            </div>
            < div className="grid grid-cols-6 gap-2" >
                {
                    ICON_OPTIONS.map(({ icon: Icon, label }) => {
                        const isSelected = selectedIcon === label;
                        return (
                            <button
                                key={label}
                                onClick={() => { onSelect(label); onClose(); }
                                }
                                className={`p-2 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-500' : 'hover:bg-neutral-100 text-neutral-600'}`}
                                title={label}
                            >
                                <Icon className="w-5 h-5" />
                            </button>
                        );
                    })}
            </div>
        </div>
    );
}

// ============================================================================
// Color Picker Component
// ============================================================================
function ColorPicker({
    selectedColor,
    onSelect,
    isOpen,
    onClose
}: {
    selectedColor?: string;
    onSelect: (colorName: string) => void;
    isOpen: boolean;
    onClose: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="absolute z-50 mt-2 p-3 bg-white rounded-xl shadow-lg border border-neutral-200" >
            <div className="flex items-center justify-between mb-2" >
                <span className="text-sm font-medium text-neutral-700" > Choose Color </span>
                < button onClick={onClose} className="text-neutral-400 hover:text-neutral-600" >
                    <X className="w-4 h-4" />
                </button>
            </div>
            < div className="grid grid-cols-8 gap-1" >
                {
                    COLOR_OPTIONS.map(({ name, class: bgClass, border }) => {
                        const isSelected = selectedColor === name;
                        return (
                            <button
                                key={name}
                                onClick={() => { onSelect(name); onClose(); }
                                }
                                className={`w-7 h-7 rounded-full ${bgClass} ${isSelected ? `ring-2 ring-offset-2 ring-neutral-400 ${border}` : ''}`}
                                title={name}
                            />
                        );
                    })}
            </div>
        </div>
    );
}

// ============================================================================
// Category Form Component (Inline Editing & Creation)
// ============================================================================
function CategoryForm({
    category,
    onSave,
    onCancel,
    isNew = false
}: {
    category?: CategoryWithUsage;
    onSave: (data: Partial<CategoryWithUsage>) => void;
    onCancel: () => void;
    isNew?: boolean;
}) {
    const [name, setName] = React.useState(category?.name || '');
    const [type, setType] = React.useState<'income' | 'expense'>(category?.type || 'expense');
    const [selectedIcon, setSelectedIcon] = React.useState(category?.icon || 'Home');
    const [selectedColor, setSelectedColor] = React.useState(category?.colour || 'Blue');
    const [showIconPicker, setShowIconPicker] = React.useState(false);
    const [showColorPicker, setShowColorPicker] = React.useState(false);
    const [error, setError] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const validateName = (name: string): string | null => {
        const trimmed = name.trim().replace(/\s+/g, ' ');
        if (!trimmed) return 'Category name is required';
        if (trimmed.length > 50) return 'Max 50 characters';
        if (!/^[a-zA-Z0-9\s\-&']+$/.test(trimmed)) return 'Only letters, numbers, spaces, hyphens, & and apostrophes are allowed';
        return null;
    };

    const handleSave = async () => {
        const validationError = validateName(name);
        if (validationError) { setError(validationError); return; }

        setSaving(true);
        setError('');

        try {
            await onSave({
                name: name.trim(),
                type,
                icon: selectedIcon,
                colour: selectedColor,
            });
            // Reset form state after successful save - only if parent didn't throw
            setName('');
            setType('expense');
            setSelectedIcon('Home');
            setSelectedColor('Blue');
        } catch (err) {
            // Don't reset form state on error so user can correct issues
            setError(err instanceof Error ? err.message : 'Failed to save category');
            setSaving(false);
            return;
        } finally {
            setSaving(false);
        }
    };

    const SelectedIconComponent = ICON_OPTIONS.find(i => i.label === selectedIcon)?.icon || Home;
    const selectedColorObj = COLOR_OPTIONS.find(c => c.name === selectedColor) || COLOR_OPTIONS[12];

    return (
        <div className="p-4 bg-white border-b border-neutral-100" >
            <div className="flex items-start gap-3" >
                {/* Icon Picker */}
                < div className="relative" >
                    <button
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className={`p-3 rounded-lg ${selectedColorObj.bgLight} ${selectedColorObj.text} hover:opacity-80 transition-opacity`
                        }
                    >
                        <SelectedIconComponent className="w-5 h-5" />
                    </button>
                    < IconPicker
                        selectedIcon={selectedIcon}
                        onSelect={setSelectedIcon}
                        isOpen={showIconPicker}
                        onClose={() => setShowIconPicker(false)}
                    />
                </div>

                {/* Name Input */}
                <div className="flex-1" >
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(''); }}
                        placeholder="Category name"
                        maxLength={50}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${error ? 'border-red-500' : 'border-neutral-200'}`}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') onCancel();
                        }}
                    />
                    {error && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-red-500">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Type Select */}
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                    className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                    <option value="expense" > Expense </option>
                    < option value="income" > Income </option>
                </select>

                {/* Color Picker */}
                <div className="relative" >
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={`p-2 rounded-lg border border-neutral-200 ${selectedColorObj.class} hover:opacity-80 transition-opacity`}
                    />
                    < ColorPicker
                        selectedColor={selectedColor}
                        onSelect={setSelectedColor}
                        isOpen={showColorPicker}
                        onClose={() => setShowColorPicker(false)}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1" >
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    </button>
                    < button
                        onClick={onCancel}
                        disabled={saving}
                        className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Merge Modal Component
// ============================================================================
function MergeModal({
    categories,
    mergeOperation,
    onConfirm,
    onCancel,
    isLoading
}: {
    categories: CategoryWithUsage[];
    mergeOperation: MergeOperation | null;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    if (!mergeOperation) return null;

    const source = categories.find(c => c.id === mergeOperation.sourceId);
    const target = categories.find(c => c.id === mergeOperation.targetId);

    if (!source || !target) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" >
            <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
            <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md p-6" >
                <div className="flex items-center gap-3 mb-4" >
                    <div className="p-2 bg-amber-100 rounded-lg" >
                        <Merge className="w-5 h-5 text-amber-600" />
                    </div>
                    < div >
                        <h2 className="text-lg font-semibold text-neutral-900" > Merge Categories </h2>
                        < p className="text-sm text-neutral-500" > Combine two categories into one </p>
                    </div>
                </div>

                < div className="space-y-4 mb-6" >
                    <div className="p-4 bg-neutral-50 rounded-lg" >
                        <p className="text-sm text-neutral-500 mb-2" > Merge INTO: </p>
                        < div className="flex items-center gap-2" >
                            <div className={`w-3 h-3 rounded-full ${COLOR_OPTIONS.find(c => c.name === target.colour)?.class || 'bg-blue-500'}`} />
                            < span className="font-medium" > {target.name} </span>
                            < span className={`px-2 py-0.5 text-xs rounded ${target.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`
                            }>
                                {target.type}
                            </span>
                        </div>
                    </div>

                    < div className="flex items-center justify-center" >
                        <div className="p-2 bg-red-100 rounded-full" >
                            <TrendingDown className="w-4 h-4 text-red-600" />
                        </div>
                    </div>

                    < div className="p-4 bg-neutral-50 rounded-lg" >
                        <p className="text-sm text-neutral-500 mb-2" > Merge FROM: </p>
                        < div className="flex items-center gap-2" >
                            <div className={`w-3 h-3 rounded-full ${COLOR_OPTIONS.find(c => c.name === source.colour)?.class || 'bg-red-500'}`} />
                            < span className="font-medium text-neutral-500" > {source.name} </span>
                            < span className={`px-2 py-0.5 text-xs rounded ${source.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-500'}`}>
                                {source.type}
                            </span>
                        </div>
                        < p className="text-xs text-neutral-400 mt-2" >
                            {source.transaction_count} transaction(s) will be reassigned
                        </p>
                    </div>
                </div>

                < div className="flex gap-3" >
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50"
                    >
                        Cancel
                    </button>
                    < button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Merge className="w-4 h-4" />}
                        Merge Categories
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Delete Confirmation Modal
// ============================================================================
function DeleteModal({
    category,
    onConfirm,
    onCancel,
    isLoading
}: {
    category: CategoryWithUsage | null;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    if (!category) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" >
            <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
            <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md p-6" >
                <div className="flex items-center gap-3 mb-4" >
                    <div className="p-2 bg-red-100 rounded-lg" >
                        <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    < div >
                        <h2 className="text-lg font-semibold text-neutral-900" > Delete Category </h2>
                        < p className="text-sm text-neutral-500" > This action cannot be undone </p>
                    </div>
                </div>

                < p className="text-neutral-600 mb-4" >
                    Delete < span className="font-medium" > "{category.name}" </span>?
                </p>

                {
                    category.transaction_count > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4" >
                            <p className="text-sm text-amber-700" >
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                {category.transaction_count} transaction(s) will become uncategorised.
                            </p>
                        </div>
                    )
                }

                <div className="flex gap-3" >
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50"
                    >
                        Cancel
                    </button>
                    < button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-semantic-error text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null
                        }
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Main Category Manager Component
// ============================================================================
export function CategoryManager() {
    const { user, isDemo } = useAuth();
    const [categories, setCategories] = useState<CategoryWithUsage[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [mergeOperation, setMergeOperation] = useState<MergeOperation | null>(null);
    const [deleteCategory, setDeleteCategory] = useState<CategoryWithUsage | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const loadCategories = useCallback(async () => {
        setLoading(true);

        if (!user?.id) {
            console.log('[CategoryManager] No user ID, skipping category load');
            setLoading(false);
            setCategories([]);
            return;
        }

        try {
            console.log('[CategoryManager] Loading categories for user:', user.id);

            // Fetch all categories - simple query like Transactions page
            const { data: allCategories, error: fetchError } = await supabase
                .from('categories')
                .select('*');

            console.log('[CategoryManager] Category query result:', {
                count: allCategories?.length,
                error: fetchError?.message
            });

            if (fetchError) {
                throw fetchError;
            }

            // Filter to show only user's categories and system defaults (where user_id is NULL)
            const filteredCategories = (allCategories || [])
                .filter(cat => cat.user_id === user.id || cat.user_id === null)
                .sort((a, b) => {
                    // Sort by sort_order first, then by name
                    if (a.sort_order !== b.sort_order) {
                        return (a.sort_order || 999) - (b.sort_order || 999);
                    }
                    return a.name.localeCompare(b.name);
                });

            if (filteredCategories && filteredCategories.length > 0) {
                // Count transactions for each category in parallel
                const categoriesWithUsage: CategoryWithUsage[] = await Promise.all(
                    filteredCategories.map(async (cat) => {
                        const { count } = await supabase
                            .from('transactions')
                            .select('*', { count: 'exact', head: true })
                            .eq('category_id', cat.id);

                        return {
                            ...cat,
                            usage_count: count || 0,
                            transaction_count: count || 0,
                        };
                    })
                );

                console.log('[CategoryManager] Loaded categories with usage:', categoriesWithUsage.length);
                setCategories(categoriesWithUsage);
            } else {
                console.log('[CategoryManager] No category data returned');
                setCategories([]);
            }
        } catch (error) {
            console.error('[CategoryManager] Error loading categories:', error);
            setGlobalError(error instanceof Error ? error.message : 'Failed to load categories');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { loadCategories(); }, [loadCategories]);

    // Filter categories
    const filteredCategories = useMemo(() => {
        return categories.filter(cat => {
            const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
            const matchesTab = activeTab === 'all' || cat.type === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [categories, search, activeTab]);

    // Get unused categories
    const unusedCategories = useMemo(() => {
        return categories.filter(cat => cat.transaction_count === 0);
    }, [categories]);

    // Handle category save with optimistic update
    const handleSaveCategory = async (data: Partial<CategoryWithUsage>) => {
        // Check if user is authenticated
        if (!user?.id) {
            throw new Error('You must be signed in to create categories');
        }

        // Check if in demo mode
        if (isDemo) {
            throw new Error('Category creation is not available in demo mode. Please sign in to create categories.');
        }

        if (editingId) {
            // Update existing category - optimistic update
            const updatedCategory: CategoryWithUsage = {
                id: editingId,
                name: data.name!,
                type: data.type!,
                icon: data.icon || 'Home',
                colour: data.colour || 'Blue',
                is_default: false,
                iva_rate: 0,
                is_deductible: data.type === 'expense',
                user_id: user.id,
                created_at: new Date().toISOString(),
                usage_count: 0,
                transaction_count: 0,
            };

            // Optimistically update UI
            setCategories(prev => prev.map(cat =>
                cat.id === editingId ? { ...cat, ...updatedCategory } : cat
            ));
            setSuccessMessage('Category updated successfully');

            // Perform actual update
            const { error } = await supabase
                .from('categories')
                .update({
                    name: data.name,
                    type: data.type,
                    icon: data.icon,
                    colour: data.colour,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', editingId);

            if (error) {
                // Revert on error
                loadCategories();
                throw error;
            }
        } else {
            // Create new category - generate temp ID for optimistic update
            const tempId = `temp-${Date.now()}`;
            const newCategory: CategoryWithUsage = {
                id: tempId,
                name: data.name!,
                type: data.type!,
                icon: data.icon || 'Home',
                colour: data.colour || 'Blue',
                is_default: false,
                iva_rate: 0,
                is_deductible: data.type === 'expense',
                user_id: user.id,
                created_at: new Date().toISOString(),
                usage_count: 0,
                transaction_count: 0,
            };

            // Optimistically add to UI
            setCategories(prev => [...prev, newCategory]);
            setSuccessMessage('Category created successfully');

            // Perform actual insert
            const { error, data: result } = await supabase
                .from('categories')
                .insert({
                    name: data.name,
                    type: data.type,
                    icon: data.icon,
                    colour: data.colour,
                    is_default: false,
                    iva_rate: '0',
                    is_deductible: data.type === 'expense',
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) {
                // Revert on error
                setCategories(prev => prev.filter(cat => cat.id !== tempId));
                throw new Error(`Failed to create category: ${error.message}`);
            }

            // Replace temp ID with actual ID
            if (result) {
                setCategories(prev => prev.map(cat =>
                    cat.id === tempId ? { ...cat, id: result.id } : cat
                ));
            }
        }

        setShowAddForm(false);
        setEditingId(null);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // Handle delete with optimistic update
    const handleDelete = async () => {
        if (!deleteCategory) {
            return;
        }

        setIsProcessing(true);

        // Optimistically remove from UI
        const categoryToDelete = deleteCategory;
        setCategories(prev => prev.filter(cat => cat.id !== deleteCategory.id));
        setSuccessMessage('Category deleted successfully');

        try {
            // Update transactions to remove category_id
            await supabase
                .from('transactions')
                .update({ category_id: null })
                .eq('category_id', deleteCategory.id);

            // Delete the category
            const { error: deleteError } = await supabase
                .from('categories')
                .delete()
                .eq('id', deleteCategory.id);

            if (deleteError) {
                // Revert on error
                loadCategories();
                throw deleteError;
            }
        } catch (error) {
            // Revert on error
            loadCategories();
            setSuccessMessage(null);
            throw error;
        } finally {
            setDeleteCategory(null);
            setIsProcessing(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    // Handle merge
    const handleMerge = async () => {
        if (!mergeOperation) return;
        setIsProcessing(true);

        try {
            const { sourceId, targetId } = mergeOperation;

            await supabase
                .from('transactions')
                .update({ category_id: targetId })
                .eq('category_id', sourceId);

            await supabase
                .from('categories')
                .delete()
                .eq('id', sourceId);

            await loadCategories();
            setMergeOperation(null);
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Error merging categories:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle bulk merge selection
    const handleBulkMerge = () => {
        const selectedArray = Array.from(selectedIds);
        if (selectedArray.length === 2) {
            setMergeOperation({
                sourceId: selectedArray[0],
                targetId: selectedArray[1],
            });
        }
    };

    // Toggle selection for merge
    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            if (newSelected.size < 2) {
                newSelected.add(id);
            }
        }
        setSelectedIds(newSelected);
    };

    // Start editing
    const startEdit = (cat: CategoryWithUsage) => {
        setEditingId(cat.id);
        setShowAddForm(false);
        setActionMenu(null);
    };

    // Archive unused categories
    const handleArchiveUnused = async () => {
        setIsProcessing(true);
        try {
            for (const cat of unusedCategories) {
                await supabase
                    .from('categories')
                    .update({ is_default: false, user_id: null })
                    .eq('id', cat.id);
            }
            await loadCategories();
        } catch (error) {
            console.error('Error archiving categories:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Get icon component (uses unique label to avoid React rendering bugs)
    const getIconComponent = (iconName?: string) => {
        // First try exact label match
        let iconOption = ICON_OPTIONS.find(i => i.label === iconName);
        if (iconOption) return iconOption.icon;
        // Fallback to case-insensitive match
        iconOption = ICON_OPTIONS.find(i => i.label.toLowerCase() === iconName?.toLowerCase());
        return iconOption?.icon || Tag;
    };

    // Get color styles
    const getColorStyles = (colorName?: string) => {
        return COLOR_OPTIONS.find(c => c.name === colorName) || COLOR_OPTIONS[12];
    };

    return (
        <div className="space-y-6" >
            {/* Global Error */}
            {globalError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    Error: {globalError}
                </div>
            )}

            {/* Success Toast */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out transform animate-in fade-in slide-in-from-top">
                    <CheckCircle2 className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            {/* Header */}
            < div className="flex items-center justify-between" >
                <div>
                    <h2 className="text-lg font-semibold text-neutral-900" > Categories </h2>
                    < p className="text-sm text-neutral-500" > Organise and manage your transaction categories </p>
                </div>
                < button
                    onClick={() => { setShowAddForm(true); setEditingId(null); }
                    }
                    disabled={showAddForm || loading || isDemo}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Category
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-card p-4 space-y-4" >
                <div className="flex items-center gap-4" >
                    {/* Search */}
                    < div className="relative flex-1 max-w-md" >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-neutral-100 rounded-lg p-1" >
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        < button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Bulk Merge (when 2 selected) */}
                    {
                        selectedIds.size === 2 && (
                            <button
                                onClick={handleBulkMerge}
                                className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                            >
                                <Merge className="w-4 h-4" />
                                Merge Selected
                            </button>
                        )
                    }

                    {/* Archive Unused */}
                    {
                        unusedCategories.length > 0 && (
                            <button
                                onClick={handleArchiveUnused}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <Archive className="w-4 h-4" />
                                Archive {unusedCategories.length} Unused
                            </button>
                        )
                    }
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 border-b border-neutral-200 pb-0" >
                    {(['all', 'income', 'expense'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-500' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            < span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-neutral-100" >
                                {tab === 'all' ? categories.length : categories.filter(c => c.type === tab).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-card" >
                {/* Add Form */}
                {
                    showAddForm && (
                        <CategoryForm
                            onSave={handleSaveCategory}
                            onCancel={() => { setShowAddForm(false); }
                            }
                            isNew
                        />
                    )}

                {/* Categories List/Grid */}
                {
                    loading ? (
                        <div className="p-12 text-center" >
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto" />
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="p-12 text-center" >
                            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4" >
                                <Tag className="w-8 h-8 text-neutral-400" />
                            </div>
                            < p className="text-neutral-500" >
                                {search ? 'No categories match your search' : 'No categories yet'}
                            </p>
                            {
                                !search && (
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="mt-4 text-brand-600 hover:text-brand-700 font-medium"
                                    >
                                        Add your first category
                                    </button>
                                )
                            }
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="divide-y divide-neutral-100" >
                            {
                                filteredCategories.map((cat) => {
                                    const IconComponent = getIconComponent(cat.icon);
                                    const colorStyles = getColorStyles(cat.colour);
                                    const isEditing = editingId === cat.id;
                                    const isSelected = selectedIds.has(cat.id);
                                    const isUnused = cat.transaction_count === 0;

                                    return (
                                        <div
                                            key={cat.id}
                                            className={`group flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors ${isUnused ? 'opacity-50' : ''} ${isSelected ? 'bg-brand-50' : ''}`
                                            }
                                        >
                                            {/* Selection Checkbox (for merge) */}
                                            < button
                                                onClick={() => toggleSelection(cat.id)}
                                                className={`w-5 h-5 rounded border-2 transition-colors ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-neutral-300 hover:border-brand-400'}`
                                                }
                                            >
                                                {isSelected && <Check className="w-3 h-3 mx-auto" />}
                                            </button>

                                            {/* Traffic Light Border */}
                                            <div className={`w-1 h-10 rounded-full ${colorStyles.class}`} />

                                            {/* Icon Badge */}
                                            <div className={`p-2 rounded-lg ${colorStyles.bgLight} ${colorStyles.text}`}>
                                                <IconComponent className="w-5 h-5" />
                                            </div>

                                            {/* Category Info */}
                                            {
                                                isEditing ? (
                                                    <CategoryForm
                                                        category={cat}
                                                        onSave={handleSaveCategory}
                                                        onCancel={() => setEditingId(null)
                                                        }
                                                    />
                                                ) : (
                                                    <div className="flex-1 min-w-0" >
                                                        <div className="flex items-center gap-2" >
                                                            <span className="font-medium text-neutral-900 truncate" > {cat.name} </span>
                                                            {
                                                                isUnused && (
                                                                    <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-500 rounded" >
                                                                        Unused
                                                                    </span>
                                                                )
                                                            }
                                                        </div>
                                                        < div className="flex items-center gap-3 mt-1" >
                                                            <span className={`px-2 py-0.5 text-xs rounded-full ${cat.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                                                                {cat.type}
                                                            </span>
                                                            {
                                                                cat.transaction_count > 0 && (
                                                                    <span className="text-xs text-neutral-400" >
                                                                        Used {cat.transaction_count} time{cat.transaction_count !== 1 ? 's' : ''}
                                                                    </span>
                                                                )
                                                            }
                                                            {
                                                                cat.is_default && (
                                                                    <span className="px-2 py-0.5 text-xs bg-brand-50 text-brand-600 rounded" >
                                                                        Default
                                                                    </span>
                                                                )
                                                            }
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Actions - Visible on Hover */}
                                            {
                                                !isEditing && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" >
                                                        <button
                                                            onClick={() => startEdit(cat)}
                                                            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        < button
                                                            onClick={() => setDeleteCategory(cat)
                                                            }
                                                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        < div className="relative" >
                                                            <button
                                                                onClick={() => setActionMenu(actionMenu === cat.id ? null : cat.id)}
                                                                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                            {
                                                                actionMenu === cat.id && (
                                                                    <div className="absolute right-0 z-10 mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1" >
                                                                        <button
                                                                            onClick={
                                                                                () => {
                                                                                    const otherSelected = Array.from(selectedIds).find(id => id !== cat.id);
                                                                                    if (otherSelected) {
                                                                                        setMergeOperation({ sourceId: cat.id, targetId: otherSelected });
                                                                                    }
                                                                                    setActionMenu(null);
                                                                                }
                                                                            }
                                                                            disabled={selectedIds.size !== 1}
                                                                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 ${selectedIds.size !== 1 ? 'opacity-50 cursor-not-allowed' : ''}`
                                                                            }
                                                                        >
                                                                            <Merge className="w-4 h-4" />
                                                                            Merge into...
                                                                        </button>
                                                                        < button
                                                                            onClick={() => {
                                                                                setSelectedIds(new Set([cat.id]));
                                                                                setActionMenu(null);
                                                                            }}
                                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                                                                        >
                                                                            <CheckCircle2 className="w-4 h-4" />
                                                                            Select for Merge
                                                                        </button>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        // Grid View
                        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" >
                            {
                                filteredCategories.map((cat) => {
                                    const IconComponent = getIconComponent(cat.icon);
                                    const colorStyles = getColorStyles(cat.colour);
                                    const isUnused = cat.transaction_count === 0;

                                    return (
                                        <div
                                            key={cat.id}
                                            className={`group relative p-4 bg-white border border-neutral-200 rounded-xl hover:shadow-md transition-all cursor-pointer ${isUnused ? 'opacity-50' : ''}`
                                            }
                                        >
                                            {/* Traffic Light Accent */}
                                            < div className={`absolute top-0 left-0 w-full h-1 rounded-t-xl ${colorStyles.class}`} />

                                            {/* Header */}
                                            < div className="flex items-start justify-between mb-3" >
                                                <div className={`p-2 rounded-lg ${colorStyles.bgLight} ${colorStyles.text}`}>
                                                    <IconComponent className="w-6 h-6" />
                                                </div>
                                                < span className={`px-2 py-0.5 text-xs rounded-full ${cat.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                                                    {cat.type}
                                                </span>
                                            </div>

                                            {/* Name */}
                                            <h3 className="font-medium text-neutral-900 truncate" > {cat.name} </h3>

                                            {/* Usage */}
                                            <p className="text-sm text-neutral-400 mt-1" >
                                                {
                                                    cat.transaction_count > 0
                                                        ? `${cat.transaction_count} transaction${cat.transaction_count !== 1 ? 's' : ''}`
                                                        : 'Unused'
                                                }
                                            </p>

                                            {/* Hover Actions */}
                                            <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2" >
                                                <button
                                                    onClick={() => startEdit(cat)}
                                                    className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                < button
                                                    onClick={() => setDeleteCategory(cat)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
            </div>

            {/* Merge Modal */}
            <MergeModal
                categories={categories}
                mergeOperation={mergeOperation}
                onConfirm={handleMerge}
                onCancel={() => setMergeOperation(null)}
                isLoading={isProcessing}
            />

            {/* Delete Modal */}
            <DeleteModal
                category={deleteCategory}
                onConfirm={handleDelete}
                onCancel={() => setDeleteCategory(null)}
                isLoading={isProcessing}
            />
        </div>
    );
}

export default CategoryManager;
