import { supabase } from './supabase';

/**
 * Logo service for fetching and caching company logos
 * Uses Brandfetch Logo API (CDN-based)
 * https://cdn.brandfetch.io/:domain?c=BRANDFETCH_CLIENT_ID
 */

// In-memory cache for logos (session duration)
const memoryCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Brandfetch Client ID - configured via environment variable
const BRANDFETCH_CLIENT_ID = import.meta.env?.VITE_BRANDFETCH_CLIENT_ID || '1idy4VqbpBNL18Z07LN';

// Brandfetch API Key (for v2 API fallback)
const BRANDFETCH_API_KEY = 'K8IQZjJOlGHxv6VCE29QldTW3pvD8EDlI8gDKAPGXO-UfxTxCj2Lq9BWokKXYdekGDdC6gSLrTSf8DyXK4Lhrw';

// Referrer policy - must be set in document for browser requests
// Accepted values: origin, origin-when-cross-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
let referrerPolicy: ReferrerPolicy = 'strict-origin-when-cross-origin';

/**
 * Configure referrer policy for logo requests
 * Must be one of: origin, origin-when-cross-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
 * Browser default is typically strict-origin-when-cross-origin
 */
export function setReferrerPolicy(policy: ReferrerPolicy): void {
    referrerPolicy = policy;
    console.log('[LogoService] Referrer policy set to:', policy);
}

/**
 * DIAGNOSTIC: Check if Brandfetch credentials are configured
 */
console.log('[LogoService] Brandfetch Client ID configured:', !!BRANDFETCH_CLIENT_ID);
console.log('[LogoService] Brandfetch API Key configured:', !!BRANDFETCH_API_KEY);

/**
 * Generate Brandfetch CDN URL for a domain
 * Uses the Logo API format: https://cdn.brandfetch.io/:domain
 * 
 * Correct URL structure per docs:
 * https://cdn.brandfetch.io/nike.com/w/400/h/400/theme/dark/fallback/lettermark/type/icon.png?c=CLIENT_ID
 */
export function getLogoUrl(
    domain: string,
    options?: {
        width?: number;
        height?: number;
        type?: 'icon' | 'symbol' | 'logo';
        format?: 'png' | 'jpg' | 'webp' | 'svg';
        theme?: 'light' | 'dark';
        fallback?: 'brandfetch' | 'transparent' | 'lettermark' | '404';
    }
): string {
    const baseUrl = `https://cdn.brandfetch.io/${domain}`;

    // Build path parameters in the correct order per Brandfetch docs:
    // /w/:w/h/:h/theme/:theme/fallback/:fallback/type/:type[.:format]
    let pathParams = '';

    if (options?.width) {
        pathParams += `/w/${options.width}`;
    }
    if (options?.height) {
        pathParams += `/h/${options.height}`;
    }
    if (options?.theme) {
        pathParams += `/theme/${options.theme}`;
    }

    // Determine fallback based on type (per docs default)
    const fallback = options?.fallback ?? (options?.type === 'icon' ? 'brandfetch' : 'transparent');
    if (fallback) {
        pathParams += `/fallback/${fallback}`;
    }

    // Format should be an extension (per docs: type/icon.png)
    const formatStr = options?.format ? `.${options.format}` : '';

    // Type with format extension (per docs: /type/icon.png)
    const typeStr = options?.type ? `/type/${options.type}${formatStr}` : '';

    // Query params
    const params = new URLSearchParams();
    params.set('c', BRANDFETCH_CLIENT_ID);

    const url = `${baseUrl}${pathParams}${typeStr}?${params.toString()}`;

    console.log('[LogoService] Generated URL:', url);

    // DIAGNOSTIC: Validate URL structure
    const typeCount = (url.match(/\/type\//g) || []).length;
    if (typeCount > 1) {
        console.error('[LogoService] ERROR: URL has duplicate /type/ segments:', url);
    }

    return url;
}

/**
 * Generate all possible CDN URLs for a company name
 * Tries multiple domains and variants
 */
export function generateAllLogoUrls(companyName: string): string[] {
    const urls: string[] = [];
    const searchTerms = generateSearchTerms(companyName);

    for (const term of searchTerms) {
        if (term.includes('.')) {
            // It's a domain - try different variants
            const variants: Array<{ type: 'icon' | 'symbol' | 'logo'; format: 'png' | 'webp' }> = [
                { type: 'icon', format: 'png' },
                { type: 'icon', format: 'webp' },
                { type: 'symbol', format: 'png' },
                { type: 'logo', format: 'png' },
            ];

            for (const variant of variants) {
                urls.push(getLogoUrl(term, {
                    width: 128,
                    height: 128,
                    ...variant
                }));
            }
        }
    }

    // Also try the cleaned company name as a domain (less likely to work but worth trying)
    const cleaned = cleanCompanyName(companyName).toLowerCase().replace(/\s+/g, '');
    if (cleaned && !searchTerms.some(t => t.includes(cleaned))) {
        urls.push(getLogoUrl(cleaned + '.com', { width: 128, height: 128, type: 'icon', format: 'png' }));
    }

    return [...new Set(urls)];
}

// Check if running in browser environment
function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Test if a logo URL is valid (returns 200 OK)
 * Also tests if the image can actually load in a browser context
 */
async function isLogoUrlValid(url: string): Promise<{ valid: boolean; status?: number; error?: string; corsError?: boolean }> {
    try {
        console.log('[LogoService] Testing URL accessibility:', url);

        // DIAGNOSTIC: Log current origin and Referer policy (browser only)
        if (isBrowser()) {
            console.log('[LogoService] Current origin:', window.location.origin);
            console.log('[LogoService] Document referrer:', document.referrer);
            const policy = (document as Document & { referrerPolicy?: string }).referrerPolicy;
            console.log('[LogoService] Document referrer policy:', policy);
            console.log('[LogoService] Configured referrer policy:', referrerPolicy);
        }

        // Test if the URL is accessible via different methods
        // Method 1: Use no-cors mode to check if image loads (may return opaque response)
        try {
            if (!isBrowser()) {
                // Server-side: just check if URL is valid format
                console.log('[LogoService] Server-side, skipping image load test');
                return { valid: true, status: 200 };
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';

            // Set referrer policy for the image element
            if (isBrowser() && 'referrerPolicy' in img) {
                (img as HTMLImageElement).referrerPolicy = referrerPolicy;
            }

            const loadPromise = new Promise<{ valid: boolean; status?: number; error?: string; corsError?: boolean }>((resolve, reject) => {
                img.onload = () => {
                    console.log('[LogoService] Image loaded successfully via <img> tag:', url);
                    resolve({ valid: true, status: 200 });
                };
                img.onerror = (event) => {
                    console.log('[LogoService] Image failed to load via <img> tag:', url, event);
                    // Check if it's a CORS issue
                    const imgError = event as Event & { message?: string };

                    // DIAGNOSTIC: Log error for debugging
                    const errorEvent = (event as Event);
                    console.log('[LogoService] Error event type:', errorEvent.type);
                    console.log('[LogoService] Error target src:', (errorEvent.target as HTMLImageElement)?.src);

                    // DIAGNOSTIC: Check if it's a 404, 403, or other HTTP error
                    // Event doesn't have message property, check for CORS indicators
                    const target = errorEvent.target as HTMLImageElement;
                    const hasCorsIndicator = url !== target?.src;

                    if (hasCorsIndicator) {
                        resolve({ valid: false, error: 'CORS error', corsError: true });
                    } else {
                        // DIAGNOSTIC: Check if it's a 404, 403, or other HTTP error
                        console.log('[LogoService] Non-CORS image load error - possible 404/403/429');
                        resolve({ valid: false, error: 'Image load failed', corsError: undefined });
                    }
                };
                img.src = url;
            });

            const result = await Promise.race([
                loadPromise,
                new Promise<{ valid: boolean; error: string }>((resolve) =>
                    setTimeout(() => resolve({ valid: false, error: 'Timeout' }), 5000)
                )
            ]);

            if (result.valid) {
                return { valid: true, status: 200, corsError: undefined };
            }
            console.log('[LogoService] Image tag test failed:', result.error);
            return { valid: false, error: result.error, corsError: undefined };

        } catch (imgError) {
            console.log('[LogoService] Image test exception:', imgError);
            return { valid: false, error: String(imgError), corsError: undefined };
        }

        // DIAGNOSTIC: Add Referer header test
        console.log('[LogoService] Testing with explicit Referer header...');
        try {
            if (!isBrowser()) {
                return { valid: false, error: 'Browser required for Referer test', corsError: undefined };
            }
            const refererUrl = document.referrer || window.location.origin;
            console.log('[LogoService] Using Referer:', refererUrl);
            const response = await fetch(url, {
                mode: 'cors',
                method: 'GET',
                headers: {
                    'Referer': refererUrl,
                }
            });
            console.log('[LogoService] Fetch with Referer header status:', response.status);
            if (response.ok) {
                return { valid: true, status: response.status, corsError: undefined };
            } else {
                return { valid: false, error: `HTTP ${response.status}`, corsError: undefined };
            }
        } catch (fetchError: any) {
            console.log('[LogoService] Fetch with Referer error:', fetchError?.message || fetchError);
            return { valid: false, error: fetchError?.message || 'Fetch failed', corsError: undefined };
        }

        // Method 2: Try fetch with mode: 'no-cors' (will return opaque response if successful)
        try {
            const response = await fetch(url, { mode: 'no-cors', method: 'GET' });
            console.log('[LogoService] Fetch with no-cors succeeded (opaque response):', url);
            return { valid: true, status: 0, corsError: undefined }; // Status 0 means opaque response
        } catch (fetchError: any) {
            console.log('[LogoService] Fetch error:', fetchError?.message || fetchError);
            const isCorsError = fetchError?.message?.includes('Failed to fetch') ||
                fetchError?.name === 'TypeError' ||
                fetchError?.message?.includes('NetworkError');
            if (isCorsError) {
                console.log('[LogoService] CORS error detected:', url);
                return { valid: false, error: fetchError?.message || 'CORS error', corsError: true };
            }
            return { valid: false, error: fetchError?.message || 'Fetch failed', corsError: undefined };
        }

    } catch (e: any) {
        console.log('[LogoService] Unexpected error testing URL:', url, e);
        return { valid: false, error: e.message };
    }
}

/**
 * Find the first valid logo URL from a list of candidates
 */
async function findValidLogoUrl(urls: string[]): Promise<string | null> {
    for (const url of urls) {
        console.log('[LogoService] Testing URL:', url);
        if (await isLogoUrlValid(url)) {
            console.log('[LogoService] Found valid URL:', url);
            return url;
        }
    }
    console.log('[LogoService] No valid URLs found');
    return null;
}

/**
 * Static mapping for known hard-to-match entities
 * Maps normalized descriptions directly to domains
 */
const DOMAIN_FALLBACK_MAP: Record<string, string> = {
    'sanitas': 'sanitas.es',
    'sanitas s a': 'sanitas.es',
    'sanitas sa': 'sanitas.es',
    'asisa': 'asisa.es',
    'adeslas': 'adeslas.es',
    'dkv': 'dkv.es',
    'dkv seguros': 'dkv.es',
    'mapfre': 'mapfre.es',
    'mapfre seguros': 'mapfre.es',
    'axa': 'axa.es',
    'allianz': 'allianz.es',
    'generali': 'generali.es',
    'caixabank': 'caixabank.es',
    'bbva': 'bbva.es',
    'santander': 'santander.es',
    'iberdrola': 'iberdrola.es',
    'endesa': 'endesa.es',
    'naturgy': 'naturgy.es',
    'repsol': 'repsol.com',
    'vodafone': 'vodafone.es',
    'movistar': 'movistar.es',
    'telefonica': 'telefonica.com',
    'aqualia': 'aqualia.com',
    'netflix': 'netflix.com',
    'spotify': 'spotify.com',
    'amazon': 'amazon.es',
    'glovo': 'glovoapp.com',
    'uber': 'uber.com',
    'carrefour': 'carrefour.es',
    'mercadona': 'mercadona.es',
    'el corte ingles': 'elcorteingles.es',
    'zara': 'zara.com',
};

/**
 * Normalize a transaction description to a domain
 * Strips common legal suffixes and converts to domain format
 */
export function normalizeDescriptionToDomain(description: string): string {
    if (!description || typeof description !== 'string') {
        return '';
    }

    // First check the fallback map with the original description
    const lowerDesc = description.toLowerCase().trim();
    if (DOMAIN_FALLBACK_MAP[lowerDesc]) {
        return DOMAIN_FALLBACK_MAP[lowerDesc];
    }

    // Strip common legal suffixes and noise
    let normalized = description
        .toLowerCase()
        .trim()
        // Replace hyphens and underscores with spaces
        .replace(/[-_]/g, ' ')
        // Replace periods with spaces
        .replace(/\./g, ' ')
        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        // Remove trailing *
        .replace(/\*\s*$/, '')
        // Remove common legal suffixes
        .replace(/\s+s\.?a\.?\s*$/i, '')      // S.A., S A
        .replace(/\s+s\.?l\.?\s*$/i, '')      // S.L., S L
        .replace(/\s+gmbh\s*$/i, '')          // GmbH
        .replace(/\s+inc\.?\s*$/i, '')        // Inc.
        .replace(/\s+ltd\.?\s*$/i, '')        // Ltd.
        .replace(/\s+sa\.?\s*$/i, '')         // SA, SA.
        .replace(/\s+sau\s*$/i, '')           // SAU
        .replace(/\s+e\.?s\.?\s*$/i, '')     // E.S.
        .replace(/\s+s\.?r\.?l\.?\s*$/i, '') // S.R.L.
        .replace(/\s+coop\.?\s*$/i, '')       // COOP
        .replace(/\s+llc\.?\s*$/i, '')        // LLC
        .replace(/\s+plc\.?\s*$/i, '')        // PLC
        .replace(/\s+b\.?v\.?\s*$/i, '')      // B.V.
        .replace(/\s+nv\s*$/i, '')            // NV
        // Remove location data (comma-separated, parentheses)
        .replace(/,\s*[^,]*$/, '')            // Remove after last comma
        .replace(/\([^)]*\)/g, '')            // Remove parentheses content
        // Remove numbers at the end
        .replace(/\s+\d+\s*$/, '')
        .trim();

    // Check fallback map again with cleaned name
    if (DOMAIN_FALLBACK_MAP[normalized]) {
        return DOMAIN_FALLBACK_MAP[normalized];
    }

    // Extract first word as potential company name
    const firstWord = normalized.split(/\s+/)[0];
    if (firstWord && DOMAIN_FALLBACK_MAP[firstWord]) {
        return DOMAIN_FALLBACK_MAP[firstWord];
    }

    // Convert to domain format (replace spaces with hyphens, add .es)
    const domainCandidate = normalized
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    // Return domain format
    if (domainCandidate.length > 2) {
        return `${domainCandidate}.es`;
    }

    return '';
}

/**
 * Clean company name by removing common suffixes
 */
export function cleanCompanyName(name: string): string {
    if (!name) return '';

    let cleaned = name
        .toLowerCase()
        .trim()
        .replace(/[-_]/g, ' ')  // Replace hyphens and underscores with spaces
        .replace(/\./g, ' ')   // Replace periods with spaces
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/\*\s*$/, '') // Remove trailing *
        .replace(/\s+S\.?A\.?\s*$/i, '') // Remove S.A., S A
        .replace(/\s+S\.?L\.?\s*$/i, '') // Remove S.L., S L
        .replace(/\s+GMBH\s*$/i, '') // Remove GmbH
        .replace(/\s+INC\.?\s*$/i, '') // Remove Inc.
        .replace(/\s+LTD\.?\s*$/i, '') // Remove Ltd.
        .replace(/\s+SL\.?$/i, '') // Remove SL
        .replace(/\s+SA\.?$/i, '') // Remove SA
        .replace(/\s+SAU$/i, '') // Remove SAU
        .replace(/\s+E\.?S\.?$/i, '') // Remove E.S.
        .replace(/\s+S\.?R\.?L\.?$/i, '') // Remove S.R.L.
        .replace(/\s+COOP\.?$/i, '') // Remove COOP
        .replace(/\s+LLC\.?$/i, '') // Remove LLC
        .replace(/\s+PLC\.?$/i, '') // Remove PLC
        .replace(/\s+B\.?V\.?$/i, '') // Remove B.V.
        .replace(/\s+NV$/i, '') // Remove NV
        .replace(/\s+AB$/i, '') // Remove AB
        .replace(/\s+OY$/i, '') // Remove OY
        .replace(/\s+AS$/i, '') // Remove AS
        .replace(/\s+SpA$/i, '') // Remove SpA
        .replace(/\s+Spzoo$/i, '') // Remove Spzoo
        .replace(/\s+ag$/i, '') // Remove ag
        .replace(/\s+gmbh$/i, '') // Remove gmbh
        .replace(/\s+kg$/i, '') // Remove kg
        .replace(/\s+resid\.?$/i, '') // Remove resid.
        .replace(/\s+residencial$/i, '') // Remove residencial
        .replace(/\s+hospitales$/i, '') // Remove hospitales
        .replace(/\s+hospital$/i, '') // Remove hospital
        .replace(/\s+clinica$/i, '') // Remove clinica
        .replace(/\s+seguro$/i, '') // Remove seguro
        .replace(/\s+seguros$/i, '') // Remove seguros
        .replace(/\s+banco$/i, '') // Remove banco
        .replace(/\s+caja$/i, '') // Remove caja
        .replace(/\s+servicios$/i, '') // Remove servicios
        .replace(/\s+comunidad$/i, '') // Remove comunidad
        .replace(/\s+vecinos$/i, '') // Remove vecinos
        .replace(/\s+agua$/i, '') // Remove agua
        .trim();

    return cleaned;
}

/**
 * Normalize company name for consistent lookups
 */
export function normalizeCompanyName(name: string): string {
    if (!name) return '';
    return cleanCompanyName(name).toLowerCase().trim();
}

/**
 * Get logo from memory cache
 */
function getFromMemoryCache(companyName: string): string | null {
    const normalized = normalizeCompanyName(companyName);
    const cached = memoryCache.get(normalized);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.url;
    }

    memoryCache.delete(normalized);
    return null;
}

/**
 * Set logo in memory cache
 */
function setInMemoryCache(companyName: string, url: string): void {
    const normalized = normalizeCompanyName(companyName);
    memoryCache.set(normalized, { url, timestamp: Date.now() });
}

/**
 * Generate search terms from company name
 * Enhanced with smart matching for Spanish company names
 */
export function generateSearchTerms(companyName: string): string[] {
    const terms: string[] = [];

    // Clean the company name first
    const cleaned = cleanCompanyName(companyName);
    const normalized = cleaned.toLowerCase().trim();

    // Also try first word only (e.g., "sanitas s a" -> "sanitas")
    const firstWord = normalized.split(/\s+/)[0];
    if (firstWord) {
        terms.push(firstWord);
    }

    // Also try the full cleaned name as a domain
    if (normalized.length > 2) {
        terms.push(normalized);
    }

    // Common domain patterns for Spanish companies
    const companyMappings: Record<string, string[]> = {
        // Health Insurance
        'sanitas': ['sanitas.es', 'sanitas.com'],
        'asisa': ['asisa.es'],
        'adeslas': ['adeslas.es'],
        'dkv': ['dkv.es'],
        'mapfre': ['mapfre.es', 'mapfre.com'],
        'axa': ['axa.es', 'axa.com'],
        'allianz': ['allianz.es', 'allianz.com'],
        'generali': ['generali.es'],
        'hna': ['hna.es'],
        'caconsalud': ['caconsalud.es'],
        'caser': ['caser.es'],
        'quironsalud': ['quironsalud.es'],
        'imq': ['imq.es'],
        'antares': ['antares.es'],
        'nueva': ['nueva-mutua.es'],
        'muface': ['muface.gob.es'],
        'mugeju': ['mugeju.es'],
        'isme': ['isme.es'],
        'hmo': ['hmohospitales.es'],
        'hospiten': ['hospiten.com'],
        'vithas': ['vithas.es'],
        'rubio': ['rubio.es'],
        'fiatc': ['fiatc.es'],
        'liberty': ['libertyseguros.es'],
        'reale': ['reale.es'],
        'winterthur': ['mapfre.es'], // Now part of Mapfre, often seen on old statements

        // Electricity & Gas
        'iberdrola': ['iberdrola.es', 'iberdrola.com'],
        'endesa': ['endesa.es'],
        'naturgy': ['naturgy.es', 'naturgy.com'],
        'repsol': ['repsol.com'],
        'cepsa': ['cepsa.es'],
        'bp': ['bp.com'],
        'shell': ['shell.es'],
        'galp': ['galp.es'],
        'total': ['total.es'],
        'eon': ['eon.es'],
        'edp': ['edp.com'],
        'hidrocantabrico': ['hcenergia.es'],
        'fenosa': ['naturgy.es'], // Union Fenosa is now Naturgy

        // Telecommunications
        'telefonica': ['telefonica.com'],
        'movistar': ['movistar.es'],
        'vodafone': ['vodafone.es'],
        'orange': ['orange.es'],
        'masmovil': ['masmovil.es'],
        'yoigo': ['yoigo.com'],
        'pepephone': ['pepephone.com'],
        'lowi': ['lowi.es'],
        'jazztel': ['jazztel.com'],
        'simyo': ['simyo.es'],
        'o2': ['o2.es'],
        'digi': ['digi.es'],
        'elegance': ['elegance.eu'], // Lowi/Jazztel sometimes appear under E more

        // Banking
        'bbva': ['bbva.es', 'bbva.com'],
        'santander': ['santander.es', 'santander.com'],
        'caixabank': ['caixabank.es'],
        'sabadell': ['sabadell.es'],
        'bankia': ['caixabank.es'], // Merged, but might still appear
        'kutxabank': ['kutxabank.es'],
        'unicaja': ['unicaja.es'],
        'bankinter': ['bankinter.es'],
        'openbank': ['openbank.es'],
        'ing': ['ing.es'],
        'abanca': ['abanca.com'],
        'ruralvia': ['ruralvia.es'],
        'ibercaja': ['ibercaja.es'],
        'cajalaboral': ['cajalaboral.es'],
        'triodos': ['triodos.es'],
        'revolut': ['revolut.com'],
        'n26': ['n26.com'],
        'wise': ['wise.com'],
        'bnext': ['bnext.es'],

        // Water
        'aqualia': ['aqualia.com'],
        'hidrogea': ['hidrogea.es'],
        'canaragua': ['canaragua.es'],
        'agbar': ['agbar.es'],
        'emasesa': ['emasesa.com'], // Sevilla
        'emsa': ['emasa.es'], // Malaga
        'emacsa': ['emacsa.es'], // Cordoba
        'canal': ['canaldeisabelii.es'], // Madrid

        // Internet/Streaming
        'netflix': ['netflix.com'],
        'amazon': ['amazon.es'],
        'spotify': ['spotify.com'],
        'disney': ['disneyplus.com'],
        'hbo': ['hbomax.com'],
        'youtube': ['youtube.com'],
        'adobe': ['adobe.com'],
        'apple': ['apple.com'],
        'google': ['google.com'],
        'microsoft': ['microsoft.com'],
        'dropbox': ['dropbox.com'],
        'cloud': ['icloud.com'],
        'skype': ['skype.com'],

        // Insurance - Home/Car
        'linea': ['lineadirecta.es'],
        'direct': ['directline.es'],
        'verti': ['verti.es'],
        'tallamigo': ['tallamigo.es'],
        'balumba': ['balumba.es'],
        'pelayo': ['pelayo.com'],
        'mutua': ['mutua.es'],
        'zurich': ['zurich.es', 'zurich.com'],
        'genesis': ['genesisseguros.com'],
        'rastreator': ['rastreator.com'],
        'kelisto': ['kelisto.es'],

        // Waste/Recycling
        'valdemingomez': ['valdemingomez.com'],
        'fcc': ['fcc.es'],
        'urbaser': ['urbaser.es'],
        'conalvial': ['conalvial.es'],
        'limpiezas': ['limpiezasmadrid.com'], // Generic helper if needed

        // Parking
        'saba': ['saba.eu'],
        'emo': ['emo.es'],
        'carly': ['carly.es'],
        'servica': ['servica24.com'],
        'metropark': ['metropark.es'],

        // Delivery
        'glovo': ['glovoapp.com'],
        'deliveroo': ['deliveroo.es'],
        'just': ['just-eat.es'],
        'uber': ['uber.com'],
        'cabify': ['cabify.com'],
        'seur': ['seur.com'],
        'mrw': ['mrw.es'],
        'correos': ['correos.es'],
        'dhl': ['dhl.es'],
        'fedex': ['fedex.com'],
        'gls': ['gls.es'],
        'nacex': ['nacex.es'],

        // Retail - Supermarkets
        'carrefour': ['carrefour.es'],
        'mercadona': ['mercadona.es'],
        'lidl': ['lidl.es'],
        'aldi': ['aldi.es'],
        'eroski': ['eroski.es'],
        'elcorteingles': ['elcorteingles.es'],
        'hipercor': ['hipercor.es'],
        'dia': ['diaz.es', 'dia.es'],
        'alcampo': ['alcampo.es'],
        'consum': ['consum.es'],
        'bonpreu': ['bonpreuesclat.cat'],
        'caprabo': ['caprabo.es'],
        'spar': ['spar.es'],
        'condis': ['condis.es'],
        'charter': ['charter.es'],
        'bonarea': ['bonarea.com'],

        // Retail - Tech/Appliances
        'mediamarkt': ['mediamarkt.es'],
        'fnac': ['fnac.es'],
        'decathlon': ['decathlon.es'],
        'worten': ['worten.es'],
        'pccomponentes': ['pccomponentes.com'],
        'coolmod': ['coolmod.com'],

        // Fashion
        'zara': ['zara.com'],
        'massimo': ['massimodutti.com'],
        'pull': ['pullandbear.com'],
        'bershka': ['bershka.com'],
        'stradivarius': ['stradivarius.com'],
        'oysho': ['oysho.com'],
        'mango': ['mango.com'],
        'lefties': ['lefties.com'],
        'springfield': ['springfield.com'],
        'sfera': ['sfera.com'],
        'desigual': ['desigual.com'],
        'h&m': ['hm.com'],
        'primark': ['primark.com'],

        // Schools/Universities
        'ie': ['ie.edu'],
        'iese': ['iese.edu'],
        'esade': ['esade.edu'],
        'deusto': ['deusto.es'],
        'unav': ['unav.es'],
        'comillas': ['comillas.edu'],
        'upf': ['upf.edu'],
        'ub': ['ub.edu'],
        'uam': ['uam.es'],
        'uc3m': ['uc3m.es'],

        // Travel/Airlines
        'renfe': ['renfe.com', 'venta.renfe.com'],
        'adif': ['adif.es'],
        'iberia': ['iberia.com'],
        'vueling': ['vueling.com'],
        'air europa': ['aireuropa.com'],
        'ryanair': ['ryanair.com'],
        'volotea': ['volotea.com'],
        'level': ['level.com'],
        'balearia': ['balearia.com'],
        'trasmediterranea': ['trasmediterranea.es'],
        'alsa': ['alsa.es'],
        'avanza': ['avanzabus.com'],
        'edreams': ['edreams.es'],
        'booking': ['booking.com'],
        'airbnb': ['airbnb.es'],
        'expedia': ['expedia.es'],
        'atravelo': ['atravelo.com'],
        'hotel': ['booking.com', 'hoteles.com'],

        // ----------------------------------------------------------------
        // GOVERNMENT, TAX & SOCIAL SECURITY (Spain Specific)
        // ----------------------------------------------------------------

        // State Government (Hacienda)
        'hacienda': ['agenciatributaria.es', 'sede.agenciatributaria.gob.es'],
        'aeat': ['agenciatributaria.es'],
        'tributos': ['agenciatributaria.es'],
        'renta': ['agenciatributaria.es'],
        'gestoria': ['agenciatributaria.es'], // Generic, but context dependent

        // Social Security & Pensions
        'seguridad social': ['seg-social.gob.es'],
        'inss': ['seg-social.gob.es'], // Instituto Nacional de la Seguridad Social
        'tgss': ['seg-social.gob.es'], // Tesorería General de la Seguridad Social
        'pension': ['seg-social.gob.es'],
        'imss': ['imss.gob.mx'], // Note: Mexico (sometimes confused by users), usually Spanish banks use Seguridad Social
        'fondo pension': ['seg-social.gob.es'], // General fallback

        // Public Employment Services
        'sepe': ['sepe.es'], // Servicio Público de Empleo Estatal
        'inem': ['sepe.es'], // Old name, still appears in some docs

        // Traffic & Transport
        'dgt': ['dgt.es'], // Dirección General de Tráfico
        'trafico': ['dgt.es'],
        'metromadrid': ['metromadrid.es'],
        'tmb': ['tmb.cat'], // Transportes Metropolitanos de Barcelona

        // City Councils (Ayuntamientos) - Major Cities
        'ayuntamiento': ['madrid.es', 'barcelona.cat', 'valencia.es'], // Common keywords
        'madrid': ['madrid.es'],
        'barcelona': ['barcelona.cat'],
        'valencia': ['valencia.es'],
        'sevilla': ['sevilla.org'],
        'zaragoza': ['zaragoza.es'],
        'malaga': ['malaga.eu'],
        'bilbao': ['bilbao.eus'],

        // Regional Governments (Comunidades Autónomas)
        'generalitat': ['gva.es', 'gencat.cat'], // Valenciana / Catalunya
        'junta': ['juntadeandalucia.es'], // Andalucia
        'xunta': ['xunta.gal'], // Galicia
        'gobcan': ['gobcan.es'], // Canarias
        'gov': ['gva.es', 'gencat.cat'], // Generic catch
        'baleares': ['caib.es'],
        'aragon': ['aragon.es'],
        'castilla la mancha': ['jccm.es'],
        'castilla leon': ['jcyl.es'],
        'asturias': ['asturias.es'],
        'cantabria': ['cantabria.es'],
        'extremadura': ['juntaex.es'],
        'murcia': ['carm.es'],
        'navarra': ['navarra.es'],
        'rioja': ['larioja.org'],
        'madrid comunidad': ['comunidad.madrid'],

        // Other common
        'com de prop': ['comunidad.madrid'],
        'sareb': ['sareb.es'],
        'cotiza': ['seg-social.gob.es'],
        'nomina': ['seg-social.gob.es'],
    };

    // Check if company name contains any known companies (exact match or start match)
    for (const [key, domains] of Object.entries(companyMappings)) {
        // Exact match
        if (normalized === key) {
            terms.push(...domains);
        }
        // Start match (e.g., "sanitas s a" starts with "sanitas")
        else if (normalized.startsWith(key) || normalized.includes(' ' + key) || normalized.includes('-' + key)) {
            terms.push(...domains);
        }
    }

    // Try additional domain patterns for cleaned company name
    const cleanedLower = cleaned.toLowerCase().replace(/\s+/g, '');
    if (cleanedLower.length > 2) {
        // Try .es first for Spanish companies
        terms.push(`${cleanedLower}.es`);
        terms.push(`${cleanedLower}.com`);
    }

    // Extract potential domain from description
    const domainMatch = normalized.match(/([a-z]+\.[a-z]+)/);
    if (domainMatch) {
        terms.push(domainMatch[1]);
    }

    // Remove duplicates and return
    return [...new Set(terms)];
}

/**
 * Fetch logo from Brandfetch v2 API (fallback)
 */
async function fetchFromBrandfetchV2API(companyName: string): Promise<string | null> {
    // First, try the new domain normalization for hard-to-match entities
    const normalizedDomain = normalizeDescriptionToDomain(companyName);
    if (normalizedDomain) {
        console.log('[LogoService] Normalized domain:', normalizedDomain);
        const cdnUrl = getLogoUrl(normalizedDomain, {
            width: 128,
            height: 128,
            type: 'icon',
            format: 'png'
        });

        // Validate the URL works
        if (await isLogoUrlValid(cdnUrl)) {
            console.log('[LogoService] Found valid logo via normalization for:', companyName);
            return cdnUrl;
        }
        console.log('[LogoService] Normalized domain did not return valid logo, trying search terms...');
    }

    // Fall back to general search terms
    const searchTerms = generateSearchTerms(companyName);
    console.log('[LogoService] Trying v2 API with terms:', searchTerms);

    for (const term of searchTerms) {
        try {
            const response = await fetch(`https://api.brandfetch.com/v2/brands/${encodeURIComponent(term)}`, {
                headers: {
                    'Authorization': `Bearer ${BRANDFETCH_API_KEY}`,
                },
            });

            if (response.ok) {
                const brandData = await response.json();

                if (brandData.logos && brandData.logos.length > 0) {
                    // Get the best logo (prefer SVG or PNG)
                    const logo = brandData.logos.find((l: { format: string }) => l.format === 'svg')
                        || brandData.logos.find((l: { format: string }) => l.format === 'png')
                        || brandData.logos[0];

                    if (logo && logo.url) {
                        console.log('[LogoService] v2 API found logo for term:', term);

                        // Extract domain from logo URL and return CDN URL
                        // The v2 API returns logos from the CDN, so we can extract the domain
                        const domainMatch = logo.url.match(/cdn\.brandfetch\.io\/([^\/]+)/);
                        if (domainMatch) {
                            const domain = domainMatch[1];
                            const cdnUrl = getLogoUrl(domain, {
                                width: 128,
                                height: 128,
                                type: 'icon',
                                format: 'png'
                            });
                            console.log('[LogoService] Generated CDN URL:', cdnUrl);
                            return cdnUrl;
                        }

                        return logo.url;
                    }
                }
            }
        } catch (e) {
            console.log('[LogoService] v2 API failed for term:', term, e);
        }
    }

    return null;
}

/**
 * Get company logo URL using Logo API (CDN-based)
 * First validates using v2 API, then returns CDN URL
 */
export async function getCompanyLogo(
    companyName: string,
    userId: string,
    forceRefresh = false
): Promise<string | null> {
    if (!companyName || !userId) {
        console.log('[LogoService] Missing companyName or userId');
        return null;
    }

    console.log('[LogoService] Fetching logo for:', companyName);

    // Check memory cache first
    const memoryCached = getFromMemoryCache(companyName);
    if (memoryCached && !forceRefresh) {
        console.log('[LogoService] Found in memory cache:', memoryCached);
        return memoryCached;
    }

    // Check database cache
    const dbCached = await getFromDatabaseCache(companyName, userId);
    if (dbCached && !forceRefresh) {
        console.log('[LogoService] Found in database cache:', dbCached);
        setInMemoryCache(companyName, dbCached);
        return dbCached;
    }

    console.log('[LogoService] Not in cache, fetching from Brandfetch v2 API...');

    // Generate search terms
    const searchTerms = generateSearchTerms(companyName);
    console.log('[LogoService] Search terms:', searchTerms);

    // Use v2 API to validate and get the logo URL
    const logoUrl = await fetchFromBrandfetchV2API(companyName);

    if (logoUrl) {
        console.log('[LogoService] Found logo:', logoUrl);
        setInMemoryCache(companyName, logoUrl);
        await cacheInDatabase(companyName, userId, logoUrl);
    } else {
        console.log('[LogoService] No logo found for:', companyName);
    }

    return logoUrl;
}

/**
 * Get logo with specific dimensions for display
 */
export async function getCompanyLogoWithSize(
    companyName: string,
    userId: string,
    width: number,
    height: number,
    forceRefresh = false
): Promise<string | null> {
    // Check cache first
    const memoryCached = getFromMemoryCache(companyName);
    if (memoryCached && !forceRefresh) {
        // Generate new URL with requested dimensions
        const searchTerms = generateSearchTerms(companyName);
        const domainTerms = searchTerms.filter(term => term.includes('.'));
        const termsToTry = domainTerms.length > 0 ? domainTerms : searchTerms;
        if (termsToTry.length > 0) {
            return getLogoUrl(termsToTry[0], { width, height, type: 'icon', format: 'png' });
        }
    }

    // Get base logo URL
    const baseUrl = await getCompanyLogo(companyName, userId, forceRefresh);
    if (!baseUrl) return null;

    // Regenerate with requested dimensions
    const searchTerms = generateSearchTerms(companyName);
    const domainTerms = searchTerms.filter(term => term.includes('.'));
    const termsToTry = domainTerms.length > 0 ? domainTerms : searchTerms;
    if (termsToTry.length > 0) {
        return getLogoUrl(termsToTry[0], { width, height, type: 'icon', format: 'png' });
    }

    return baseUrl;
}

/**
 * Fetch logo from database cache
 */
async function getFromDatabaseCache(companyName: string, userId: string): Promise<string | null> {
    const normalized = normalizeCompanyName(companyName);

    try {
        const { data, error } = await supabase
            .from('company_logos')
            .select('logo_url, last_fetched')
            .eq('user_id', userId)
            .eq('company_name', normalized)
            .single();

        if (error || !data) {
            return null;
        }

        // Check if cache is still valid (30 days)
        const cacheAge = Date.now() - new Date(data.last_fetched).getTime();
        const maxAge = 30 * 24 * 60 * 60 * 1000;

        if (cacheAge < maxAge && data.logo_url) {
            return data.logo_url;
        }
    } catch (e) {
        console.log('[LogoService] Database cache error:', e);
    }

    return null;
}

/**
 * Cache logo in database
 */
async function cacheInDatabase(
    companyName: string,
    userId: string,
    logoUrl: string | null
): Promise<void> {
    const normalized = normalizeCompanyName(companyName);

    try {
        await supabase
            .from('company_logos')
            .upsert({
                user_id: userId,
                company_name: normalized,
                logo_url: logoUrl,
                last_fetched: new Date().toISOString(),
            }, {
                onConflict: 'user_id, company_name',
            });
    } catch (e) {
        console.log('[LogoService] Failed to cache logo:', e);
    }
}

/**
 * Clear logo cache for a specific company in database
 */
export async function clearLogoCacheInDatabase(companyName: string, userId: string): Promise<void> {
    const normalized = normalizeCompanyName(companyName);

    try {
        await supabase
            .from('company_logos')
            .delete()
            .eq('user_id', userId)
            .eq('company_name', normalized);
    } catch (e) {
        console.log('[LogoService] Failed to clear database cache:', e);
    }
}

/**
 * Clear all logo cache for a user
 */
export async function clearAllLogoCacheInDatabase(userId: string): Promise<void> {
    try {
        await supabase
            .from('company_logos')
            .delete()
            .eq('user_id', userId);
    } catch (e) {
        console.log('[LogoService] Failed to clear all database cache:', e);
    }
}

/**
 * Preload logos for a list of company names
 */
export async function preloadLogos(
    companyNames: string[],
    userId: string
): Promise<void> {
    const uncached = companyNames.filter(name => !getFromMemoryCache(name));

    // Fetch in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < uncached.length; i += batchSize) {
        const batch = uncached.slice(i, i + batchSize);
        await Promise.all(
            batch.map(name => getCompanyLogo(name, userId))
        );
    }
}

/**
 * Clear logo cache for a specific company
 */
export function clearLogoCache(companyName: string): void {
    const normalized = normalizeCompanyName(companyName);
    memoryCache.delete(normalized);
}

/**
 * Clear all logo cache
 */
export function clearAllLogoCache(): void {
    memoryCache.clear();
}
