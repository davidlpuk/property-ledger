Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { companyName, forceRefresh, width, height } = await req.json();

        if (!companyName) {
            throw new Error('Company name is required');
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const brandfetchClientId = Deno.env.get('BRANDFETCH_CLIENT_ID');

        if (!brandfetchClientId) {
            throw new Error('BRANDFETCH_CLIENT_ID environment variable is not set');
        }

        // Normalize company name for lookup
        const normalizedName = cleanCompanyName(companyName).toLowerCase().trim();

        // Check cache first (unless forceRefresh)
        if (!forceRefresh) {
            const { data: cachedLogo } = await fetch(
                `${supabaseUrl}/rest/v1/company_logos?company_name=eq.${encodeURIComponent(normalizedName)}&select=*`,
                {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                    },
                }
            ).then(r => r.json());

            if (cachedLogo && cachedLogo.length > 0) {
                const cached = cachedLogo[0];
                // Check if cache is still valid (30 days)
                const cacheAge = Date.now() - new Date(cached.last_fetched).getTime();
                const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

                if (cacheAge < maxAge && cached.logo_url) {
                    // Generate URL with requested dimensions if specified
                    const logoUrl = generateLogoUrl(cached.base_domain || normalizedName, {
                        width: width || 64,
                        height: height || 64,
                        clientId: brandfetchClientId,
                    });

                    return new Response(JSON.stringify({
                        data: {
                            logo_url: logoUrl,
                            cached: true,
                            company_name: normalizedName,
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
            }
        }

        // Generate search terms from company name
        const searchTerms = generateSearchTerms(companyName);
        console.log('Searching Logo API with terms:', searchTerms);

        let logoUrl = null;
        let baseDomain = null;

        // Try each search term until we get a valid logo URL
        // The Logo API expects actual domains, not just company names
        for (const term of searchTerms) {
            logoUrl = generateLogoUrl(term, {
                width: width || 64,
                height: height || 64,
                clientId: brandfetchClientId,
            });
            baseDomain = term;
            console.log('Generated Logo URL for term:', term, logoUrl);
            // Try each term - domains like 'sanitas.es' work better than just 'sanitas'
            // Note: We generate all URLs but only store the first one
            // The actual fallback happens when the image is loaded in the browser
        }

        // Update cache (insert or update)
        if (logoUrl || !forceRefresh) {
            await fetch(
                `${supabaseUrl}/rest/v1/company_logos`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates',
                    },
                    body: JSON.stringify({
                        company_name: normalizedName,
                        logo_url: logoUrl,
                        base_domain: baseDomain,
                        last_fetched: new Date().toISOString(),
                    }),
                }
            );
        }

        return new Response(JSON.stringify({
            data: {
                logo_url: logoUrl,
                cached: false,
                company_name: normalizedName,
                search_terms: searchTerms,
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: { code: 'LOGO_FETCH_FAILED', message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

/**
 * Generate Logo API URL
 * https://cdn.brandfetch.io/:domain?c=BRANDFETCH_CLIENT_ID
 */
function generateLogoUrl(
    domain: string,
    options: {
        width: number;
        height: number;
        clientId: string;
        theme?: 'light' | 'dark';
        type?: 'icon' | 'symbol' | 'logo';
        fallback?: 'brandfetch' | 'transparent' | 'lettermark' | '404';
        format?: 'png' | 'jpg' | 'svg' | 'webp';
    }
): string {
    const {
        width = 64,
        height = 64,
        clientId,
        theme,
        type = 'icon',
        fallback,
        format = 'png',
    } = options;

    let urlPath = `https://cdn.brandfetch.io/${encodeURIComponent(domain)}`;

    // Add dimensions
    urlPath += `/w/${width}/h/${height}`;

    // Add theme if specified
    if (theme) {
        urlPath += `/theme/${theme}`;
    }

    // Add fallback if specified
    if (fallback) {
        urlPath += `/fallback/${fallback}`;
    }

    // Add type
    urlPath += `/type/${type}`;

    // Add format extension
    urlPath += `.${format}`;

    // Add client ID
    urlPath += `?c=${clientId}`;

    return urlPath;
}

/**
 * Clean company name by removing common suffixes
 */
function cleanCompanyName(name: string): string {
    if (!name) return '';

    let cleaned = name
        .toLowerCase()
        .trim()
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
        .replace(/\s+resid\.?$/i, '') // Remove resid.
        .replace(/\s+residencial$/i, '') // Remove residencial
        .replace(/\s+hospitales$/i, '') // Remove hospitales
        .replace(/\s+hospital$/i, '') // Remove hospital
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
 * Generate search terms from company name
 */
function generateSearchTerms(companyName: string): string[] {
    const terms: string[] = [];

    // Clean the company name first
    const cleaned = cleanCompanyName(companyName);
    const normalized = cleaned.toLowerCase().trim();

    // Original cleaned name
    terms.push(normalized);

    // Also try first word only (e.g., "sanitas s a" -> "sanitas")
    const firstWord = normalized.split(/\s+/)[0];
    if (firstWord && firstWord !== normalized) {
        terms.push(firstWord);
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
        'hmo': ['hmohospitales.es'],
        'hospiten': ['hospiten.com'],
        'vithas': ['vithas.es'],
        'rubio': ['rubio.es'],

        // Electricity & Gas
        'iberdrola': ['iberdrola.es', 'iberdrola.com'],
        'endesa': ['endesa.es'],
        'naturgy': ['naturgy.es', 'naturgy.com'],
        'repsol': ['repsol.com'],
        'ceca': ['ceca.es'],

        // Telecommunications
        'telefonica': ['telefonica.com'],
        'movistar': ['movistar.es'],
        'vodafone': ['vodafone.es'],
        'orange': ['orange.es'],
        'masmovil': ['masmovil.es'],
        'yoigo': ['yoigo.com'],
        'pepephone': ['pepephone.com'],
        'lowi': ['lowi.es'],

        // Banking
        'bbva': ['bbva.es', 'bbva.com'],
        'santander': ['santander.es', 'santander.com'],
        'caixabank': ['caixabank.es'],
        'sabadell': ['sabadell.es'],
        'bankia': ['bankia.es'],
        'kutxabank': ['kutxabank.es'],
        'unicaja': ['unicaja.es'],
        'bankinter': ['bankinter.es'],
        'openbank': ['openbank.es'],
        'ing': ['ing.es'],

        // Water
        'hidrogea': ['hidrogea.es'],
        'canaragua': ['canaragua.es'],
        'agbar': ['agbar.es'],

        // Internet/Streaming
        'netflix': ['netflix.com'],
        'amazon': ['amazon.es'],
        'spotify': ['spotify.com'],
        'disney': ['disneyplus.com'],
        'hbo': ['hbo.com'],

        // Insurance - Home/Car
        'linea': ['lineadirecta.es'],
        'direct': ['directline.es'],
        'verti': ['verti.es'],
        'tallamigo': ['tallamigo.es'],
        'balumba': ['balumba.es'],
        'pelayo': ['pelayo.com'],
        'zurich': ['zurich.es'],

        // Waste/Recycling
        'valdemingomez': ['valdemingomez.com'],
        'fcc': ['fcc.es'],
        'urbaser': ['urbaser.es'],

        // Parking
        'saba': ['saba.eu'],
        'emo': ['emo.es'],
        'carly': ['carly.es'],

        // Delivery
        'glovo': ['glovoapp.com'],
        'deliveroo': ['deliveroo.es'],
        'just': ['just-eat.es'],
        'uber': ['uber.com'],
        'cabify': ['cabify.com'],

        // Retail
        'carrefour': ['carrefour.es'],
        'mercadona': ['mercadona.es'],
        'lidl': ['lidl.es'],
        'aldi': ['aldi.es'],
        'eroski': ['eroski.es'],
        'elcorteingles': ['elcorteingles.es'],
        'mediamarkt': ['mediamarkt.es'],
        'fnac': ['fnac.es'],
        'decathlon': ['decathlon.es'],

        // Fashion
        'zara': ['zara.com'],
        'massimo': ['massimodutti.com'],
        'pull': ['pullandbear.com'],
        'bershka': ['bershka.com'],
        'stradivarius': ['stradivarius.com'],
        'oysho': ['oysho.com'],

        // Other common
        'edreams': ['edreams.es'],
        'booking': ['booking.com'],
        'airbnb': ['airbnb.es'],
    };

    // Check if company name contains any known companies (using cleaned name)
    for (const [key, domains] of Object.entries(companyMappings)) {
        if (normalized.includes(key)) {
            terms.push(...domains);
        }
    }

    // Extract potential domain from description
    const domainMatch = normalized.match(/([a-z]+\.[a-z]+)/);
    if (domainMatch) {
        terms.push(domainMatch[1]);
    }

    // Remove duplicates and return
    return [...new Set(terms)];
}
