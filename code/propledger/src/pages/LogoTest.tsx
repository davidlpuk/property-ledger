import { useState, useEffect } from 'react';
import { getCompanyLogo, getLogoUrl, cleanCompanyName, generateSearchTerms, clearAllLogoCache, clearAllLogoCacheInDatabase } from '../lib/logoService';
import { useAuth } from '../contexts/AuthContext';

const defaultTestCompanies = [
    'SANITAS S A',
    'NATURGY*',
    'CASER RESID.',
    'IBERDROLA DISTRIBUCION',
    'ENDESA ENERGIA SA',
    'BBVA SA',
    'MOVISTAR',
    'VODAFONE ESPAÑA',
    'REPSOL BUTANO',
    'AMAZON PRIME',
    'NETFLIX.COM',
    'unknown company xyz',
];

export default function LogoTestPage() {
    const { user } = useAuth();
    const [results, setResults] = useState<Record<string, { url: string | null; cleaned: string; terms: string[] }>>({});
    const [loading, setLoading] = useState(false);
    const [clearingCache, setClearingCache] = useState(false);
    const [customCompany, setCustomCompany] = useState('');
    const [testCompanies, setTestCompanies] = useState(defaultTestCompanies);

    async function testLogos(forceRefresh = false, companies = testCompanies) {
        if (!user) return;

        setLoading(true);
        const newResults: Record<string, { url: string | null; cleaned: string; terms: string[] }> = {};

        for (const company of companies) {
            const cleaned = cleanCompanyName(company);
            const terms = generateSearchTerms(company);

            console.log(`Testing: "${company}" -> cleaned: "${cleaned}" -> terms:`, terms);

            const url = await getCompanyLogo(company, user.id, forceRefresh);
            newResults[company] = { url, cleaned, terms };
        }

        setResults(newResults);
        setLoading(false);
    }

    useEffect(() => {
        testLogos();
    }, [user]);

    async function handleClearCache() {
        if (!user) return;

        setClearingCache(true);
        clearAllLogoCache();
        await clearAllLogoCacheInDatabase(user.id);
        // Force refresh after clearing cache
        await testLogos(true);
        setClearingCache(false);
    }

    function handleAddCustomCompany() {
        if (customCompany.trim()) {
            const newCompanies = [...testCompanies, customCompany.trim()];
            setTestCompanies(newCompanies);
            setCustomCompany('');
            // Test the new company
            testLogos(false, [customCompany.trim()]);
        }
    }

    function handleTestFromTransactions() {
        // Try some common transaction descriptions
        const txDescriptions = [
            'SANITAS',
            'SANITAS SA',
            'IBERDROLA',
            'ENDESA',
            'BBVA',
            'MOVISTAR',
            'VODAFONE',
            'NETFLIX',
            'AMAZON',
        ];
        setTestCompanies(txDescriptions);
        testLogos(true, txDescriptions);
    }

    if (!user) {
        return <div className="p-8">Please log in to test</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold mb-6">Logo Test Page</h1>

            <div className="mb-6 flex gap-4 flex-wrap">
                <button
                    onClick={() => testLogos(true)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Force Refresh All'}
                </button>
                <button
                    onClick={handleClearCache}
                    disabled={clearingCache}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                    {clearingCache ? 'Clearing...' : 'Clear Cache & Refresh'}
                </button>
                <button
                    onClick={handleTestFromTransactions}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                    Test Transaction Descriptions
                </button>
            </div>

            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Add Custom Company</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customCompany}
                        onChange={(e) => setCustomCompany(e.target.value)}
                        placeholder="Enter company name from transactions"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCompany()}
                    />
                    <button
                        onClick={handleAddCustomCompany}
                        disabled={!customCompany.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        Test
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    Tip: Use the exact company name as it appears in your transactions
                </p>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="space-y-4 max-w-4xl">
                    {Object.entries(results).map(([company, { url, cleaned, terms }]) => (
                        <div key={company} className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {url ? (
                                    <img src={url} alt={company} className="w-8 h-8 object-contain" onError={(e) => {
                                        console.log('[LogoTest] Image failed to load:', url);
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }} />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">{company}</div>
                                <div className="text-sm text-gray-500">
                                    Cleaned: <code className="bg-gray-100 px-1 rounded">{cleaned}</code>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Search terms: <code className="bg-gray-100 px-1 rounded">{terms.join(', ')}</code>
                                </div>
                                <div className="text-sm">
                                    Status: {url ? (
                                        <span className="text-green-600">✓ Found</span>
                                    ) : (
                                        <span className="text-red-500">✗ Not found</span>
                                    )}
                                </div>
                                {url && (
                                    <div className="text-xs text-gray-400 mt-1 break-all">
                                        URL: {url}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Debug Instructions</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    <li>Open browser DevTools (F12) → Console</li>
                    <li>Look for [LogoService] logs</li>
                    <li>Copy a company name from your transactions</li>
                    <li>Enter it in the "Add Custom Company" field above</li>
                    <li>Click "Test" to see if the logo is found</li>
                    <li>If found, the URL will work in transactions page</li>
                    <li>If not found, check the "Search terms" to see what domains are being tried</li>
                </ol>
            </div>
        </div>
    );
}
