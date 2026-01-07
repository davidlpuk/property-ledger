import React, { useState, useEffect } from 'react';
import { getCompanyLogo, getLogoUrl, cleanCompanyName, generateSearchTerms, clearLogoCache, clearLogoCacheInDatabase } from '../lib/logoService';
import { useAuth } from '../contexts/AuthContext';

interface CompanyLogoProps {
    companyName: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    /** Debug mode shows URL and search terms */
    debug?: boolean;
    /** Force refresh logo from API, bypassing cache */
    forceRefresh?: boolean;
}

const sizeConfig = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { container: 'w-12 h-12', icon: 'w-6 h-6' },
};

export function CompanyLogo({ companyName, size = 'sm', className = '', debug = false, forceRefresh = false }: CompanyLogoProps) {
    const { user } = useAuth();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [debugInfo, setDebugInfo] = useState<{ cleaned: string; terms: string[]; url: string | null } | null>(null);

    const sizes = sizeConfig[size];

    console.log('[CompanyLogo] Rendering for:', companyName, 'user:', !!user);

    useEffect(() => {
        let mounted = true;

        async function fetchLogo() {
            console.log('[CompanyLogo] Fetching logo for:', companyName, 'user:', !!user);

            if (!companyName) {
                console.log('[CompanyLogo] Missing companyName, skipping');
                if (mounted) {
                    setLoading(false);
                }
                return;
            }

            // For debugging, generate URL directly without user check
            if (debug) {
                const cleaned = cleanCompanyName(companyName);
                const terms = generateSearchTerms(companyName);
                const url = terms.length > 0 ? getLogoUrl(terms[0], { width: 64, height: 64, type: 'icon', format: 'png' }) : null;

                console.log('[CompanyLogo] Debug mode - cleaned:', cleaned, 'terms:', terms, 'url:', url);

                if (mounted) {
                    setLogoUrl(url);
                    setDebugInfo({ cleaned, terms, url });
                    setLoading(false);
                }
                return;
            }

            if (!user) {
                console.log('[CompanyLogo] No user, skipping');
                if (mounted) {
                    setLoading(false);
                }
                return;
            }

            try {
                const url = await getCompanyLogo(companyName, user.id, forceRefresh);
                console.log('[CompanyLogo] Got URL:', url);
                if (mounted) {
                    setLogoUrl(url);
                    setLoading(false);
                }
            } catch (err) {
                console.error('[CompanyLogo] Error:', err);
                if (mounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        }

        fetchLogo();

        return () => {
            mounted = false;
        };
    }, [companyName, user, debug, forceRefresh]);

    if (loading) {
        return (
            <div
                className={`${sizes.container} rounded-full bg-neutral-100 animate-pulse flex-shrink-0 ${className}`}
            />
        );
    }

    if (error || !logoUrl) {
        // Fallback: blank white circle
        return (
            <div
                className={`${sizes.container} rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 ${className}`}
                title={`No logo found for: ${companyName}`}
            >
                {debug && debugInfo && (
                    <div className="text-xs text-gray-400 p-1">
                        {debugInfo.terms[0] || 'no-term'}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={`${sizes.container} rounded-full bg-white border border-neutral-200 flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
        >
            <img
                src={logoUrl}
                alt={`${companyName} logo`}
                referrerPolicy="strict-origin-when-cross-origin"
                className={`${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-7 h-7' : 'w-9 h-9'} object-contain`}
                onError={(e) => {
                    console.log('[CompanyLogo] Image failed to load:', logoUrl);
                    // Log additional info for debugging
                    const img = e.currentTarget;
                    console.log('[CompanyLogo] Natural size:', img.naturalWidth, 'x', img.naturalHeight);
                    console.log('[CompanyLogo] Complete:', img.complete);
                    setError(true);
                }}
                loading="lazy"
            />
        </div>
    );
}

export default CompanyLogo;
