// ============================================================================
// Mock Data Structure for Category Manager
// ============================================================================
// This file provides mock data for testing the CategoryManager component.
// It demonstrates the expected data structure including icon, color, type, and usage_count.

// ============================================================================
// Category Interface (from lib/types.ts)
// ============================================================================
// interface Category {
//     id: string;
//     user_id?: string;
//     name: string;
//     type: 'income' | 'expense';
//     is_default: boolean;
//     iva_rate: number;
//     is_deductible: boolean;
//     parent_id?: string;
//     icon?: string;
//     colour?: string;
//     created_at: string;
//     children?: Category[];
// }

// ============================================================================
// Extended CategoryWithUsage Interface (from CategoryManager.tsx)
// ============================================================================
// interface CategoryWithUsage extends Category {
//     usage_count: number;
//     last_used?: string;
//     transaction_count: number;
// }

// ============================================================================
// Available Icons (must match ICON_OPTIONS in CategoryManager.tsx)
// ============================================================================
// const ICON_OPTIONS = [
//     { icon: Home, label: 'Home' },
//     { icon: Briefcase, label: 'Work' },
//     { icon: ShoppingCart, label: 'Shopping' },
//     { icon: Car, label: 'Transport' },
//     { icon: Utensils, label: 'Food' },
//     { icon: Heart, label: 'Health' },
//     { icon: Lightbulb, label: 'Utilities' },
//     { icon: Book, label: 'Education' },
//     { icon: Plane, label: 'Travel' },
//     { icon: Phone, label: 'Phone' },
//     { icon: Wifi, label: 'Internet' },
//     { icon: Zap, label: 'Electricity' },
//     { icon: Droplets, label: 'Water' },
//     { icon: Building, label: 'Property' },
//     { icon: Key, label: 'Rent' },
//     { icon: Wrench, label: 'Maintenance' },
//     { icon: Paintbrush, label: 'Decoration' },
//     { icon: Dog, label: 'Pets' },
//     { icon: Baby, label: 'Family' },
//     { icon: Gift, label: 'Gifts' },
//     { icon: Music, label: 'Entertainment' },
//     { icon: Gamepad2, label: 'Hobbies' },
//     { icon: Camera, label: 'Photography' },
//     { icon: Code, label: 'Technology' },
//     { icon: DollarSign, label: 'Money' },
//     { icon: TrendingUp, label: 'Income' },
//     { icon: TrendingDown, label: 'Expenses' },
//     { icon: CreditCard, label: 'Credit' },
//     { icon: Wallet, label: 'Cash' },
//     { icon: PiggyBank, label: 'Savings' },
//     { icon: Target, label: 'Goals' },
// ];

// ============================================================================
// Available Colors (must match COLOR_OPTIONS in CategoryManager.tsx)
// ============================================================================
// const COLOR_OPTIONS = [
//     { name: 'Emerald', class: 'bg-emerald-500', text: 'text-emerald-600', bgLight: 'bg-emerald-50' },
//     { name: 'Green', class: 'bg-green-500', text: 'text-green-600', bgLight: 'bg-green-50' },
//     { name: 'Lime', class: 'bg-lime-500', text: 'text-lime-600', bgLight: 'bg-lime-50' },
//     { name: 'Amber', class: 'bg-amber-500', text: 'text-amber-600', bgLight: 'bg-amber-50' },
//     { name: 'Orange', class: 'bg-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-50' },
//     { name: 'Red', class: 'bg-red-500', text: 'text-red-600', bgLight: 'bg-red-50' },
//     { name: 'Rose', class: 'bg-rose-500', text: 'text-rose-600', bgLight: 'bg-rose-50' },
//     { name: 'Pink', class: 'bg-pink-500', text: 'text-pink-600', bgLight: 'bg-pink-50' },
//     { name: 'Purple', class: 'bg-purple-500', text: 'text-purple-600', bgLight: 'bg-purple-50' },
//     { name: 'Violet', class: 'bg-violet-500', text: 'text-violet-600', bgLight: 'bg-violet-50' },
//     { name: 'Indigo', class: 'bg-indigo-500', text: 'text-indigo-600', bgLight: 'bg-indigo-50' },
//     { name: 'Blue', class: 'bg-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-50' },
//     { name: 'Sky', class: 'bg-sky-500', text: 'text-sky-600', bgLight: 'bg-sky-50' },
//     { name: 'Cyan', class: 'bg-cyan-500', text: 'text-cyan-600', bgLight: 'bg-cyan-50' },
//     { name: 'Teal', class: 'bg-teal-500', text: 'text-teal-600', bgLight: 'bg-teal-50' },
// ];

// ============================================================================
// Mock Categories Data
// ============================================================================
export const MOCK_CATEGORIES = [
    // Income Categories
    {
        id: 'cat-1',
        user_id: 'user-1',
        name: 'Rental Income',
        type: 'income' as const,
        is_default: true,
        iva_rate: 0,
        is_deductible: false,
        icon: 'Building',
        colour: 'Green',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 45,
        transaction_count: 45,
    },
    {
        id: 'cat-2',
        user_id: 'user-1',
        name: 'Additional Income',
        type: 'income' as const,
        is_default: false,
        iva_rate: 0,
        is_deductible: false,
        icon: 'DollarSign',
        colour: 'Emerald',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 12,
        transaction_count: 12,
    },
    {
        id: 'cat-3',
        user_id: 'user-1',
        name: 'Deposit Refund',
        type: 'income' as const,
        is_default: false,
        iva_rate: 0,
        is_deductible: false,
        icon: 'Wallet',
        colour: 'Sky',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 3,
        transaction_count: 3,
    },
    // Expense Categories
    {
        id: 'cat-4',
        user_id: 'user-1',
        name: 'Mortgage',
        type: 'expense' as const,
        is_default: true,
        iva_rate: 0,
        is_deductible: true,
        icon: 'Building',
        colour: 'Red',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 24,
        transaction_count: 24,
    },
    {
        id: 'cat-5',
        user_id: 'user-1',
        name: 'Property Tax',
        type: 'expense' as const,
        is_default: true,
        iva_rate: 0,
        is_deductible: true,
        icon: 'FileText',
        colour: 'Amber',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 4,
        transaction_count: 4,
    },
    {
        id: 'cat-6',
        user_id: 'user-1',
        name: 'Insurance',
        type: 'expense' as const,
        is_default: false,
        iva_rate: 0,
        is_deductible: true,
        icon: 'Shield',
        colour: 'Violet',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 12,
        transaction_count: 12,
    },
    {
        id: 'cat-7',
        user_id: 'user-1',
        name: 'Maintenance',
        type: 'expense' as const,
        is_default: true,
        iva_rate: 21,
        is_deductible: true,
        icon: 'Wrench',
        colour: 'Orange',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 28,
        transaction_count: 28,
    },
    {
        id: 'cat-8',
        user_id: 'user-1',
        name: 'Electricity',
        type: 'expense' as const,
        is_default: false,
        iva_rate: 21,
        is_deductible: true,
        icon: 'Zap',
        colour: 'Yellow',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 36,
        transaction_count: 36,
    },
    {
        id: 'cat-9',
        user_id: 'user-1',
        name: 'Water',
        type: 'expense' as const,
        is_default: false,
        iva_rate: 21,
        is_deductible: true,
        icon: 'Droplets',
        colour: 'Blue',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 12,
        transaction_count: 12,
    },
    {
        id: 'cat-10',
        user_id: 'user-1',
        name: 'Internet & Phone',
        type: 'expense' as const,
        is_default: false,
        iva_rate: 21,
        is_deductible: true,
        icon: 'Wifi',
        colour: 'Cyan',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 12,
        transaction_count: 12,
    },
    {
        id: 'cat-11',
        user_id: 'user-1',
        name: 'Communal Areas',
        type: 'expense' as const,
        is_default: false,
        iva_rate: 21,
        is_deductible: true,
        icon: 'Home',
        colour: 'Teal',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 4,
        transaction_count: 4,
    },
    {
        id: 'cat-12',
        user_id: 'user-1',
        name: 'Legal Fees',
        type: 'expense' as const,
        is_default: false,
        iva_rate: 21,
        is_deductible: true,
        icon: 'Scale',
        colour: 'Slate',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 2,
        transaction_count: 2,
    },
    // Unused Categories (for testing archive functionality)
    {
        id: 'cat-13',
        user_id: 'user-1',
        name: 'Garden Maintenance',
        type: 'expense' as const,
        is_default: false,
        iva_rate: 21,
        is_deductible: true,
        icon: 'Trees',
        colour: 'Green',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 0,
        transaction_count: 0,
    },
    {
        id: 'cat-14',
        user_id: 'user-1',
        name: 'Pest Control',
        type: 'expense' as const,
        is_default: false,
        iva_rate: 21,
        is_deductible: true,
        icon: 'Bug',
        colour: 'Rose',
        created_at: '2024-01-01T00:00:00Z',
        usage_count: 0,
        transaction_count: 0,
    },
];

// ============================================================================
// Merge Operation Example
// ============================================================================
// const mergeOperation: MergeOperation = {
//     sourceId: 'cat-13',  // Category to be deleted
//     targetId: 'cat-7',   // Category to receive transactions
// };

// ============================================================================
// Usage Examples
// ============================================================================
//
// 1. Filtering categories by type:
//    const incomeCategories = categories.filter(c => c.type === 'income');
//    const expenseCategories = categories.filter(c => c.type === 'expense');
//
// 2. Finding unused categories:
//    const unusedCategories = categories.filter(c => c.transaction_count === 0);
//
// 3. Getting most used categories:
//    const sortedByUsage = [...categories].sort((a, b) => b.transaction_count - a.transaction_count);
//
// 4. Merge categories (pseudocode):
//    async function mergeCategories(sourceId: string, targetId: string) {
//        // Update all transactions from source to target
//        await supabase
//            .from('transactions')
//            .update({ category_id: targetId })
//            .eq('category_id', sourceId);
//
//        // Delete the source category
//        await supabase
//            .from('categories')
//            .delete()
//            .eq('id', sourceId);
//    }
//
// 5. Archive unused categories (pseudocode):
//    async function archiveUnusedCategories() {
//        const unused = categories.filter(c => c.transaction_count === 0);
//        for (const cat of unused) {
//            await supabase
//                .from('categories')
//                .update({ is_default: false, user_id: null })
//                .eq('id', cat.id);
//        }
//    }
