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
    const { description, amount, categories } = await req.json();

    if (!description) {
      throw new Error('Transaction description is required');
    }

    // Simple rule-based AI categorization
    const descLower = description.toLowerCase();
    const isIncome = amount >= 0;
    
    // Category matching rules based on Spanish banking transaction patterns
    const rules = [
      // Income patterns - check these first for negative amounts (bank shows income as negative)
      { pattern: /alquiler|renta|arrendamiento|mensualidad|transferencia.*recibida/i, category: 'Rent Income', type: 'income' },
      { pattern: /fianza|deposito|deposit/i, category: 'Security Deposit', type: 'income' },
      { pattern: /bizum.*recibido|recibido.*bizum/i, category: 'Rent Income', type: 'income' },
      
      // Expense patterns
      { pattern: /hipoteca|mortgage|interes.*banco|banco.*interes|caixabank|bbva.*hipoteca/i, category: 'Mortgage Interest', type: 'expense' },
      { pattern: /ibi|impuesto.*inmueble|ayuntamiento|ayto\./i, category: 'Property Tax (IBI)', type: 'expense' },
      { pattern: /comunidad|vecinos|administra.*fincas|propietarios|edificio/i, category: 'Community Fees', type: 'expense' },
      { pattern: /seguro|insurance|mapfre|axa|zurich|allianz|poliza|hogar/i, category: 'Insurance', type: 'expense' },
      { pattern: /reparacion|fontaner|electric|pintur|mantenimiento|arreglo|averia|fuga|leroy|materiales/i, category: 'Repairs & Maintenance', type: 'expense' },
      { pattern: /abogad|notari|gestor|asesori|contabl|agencia|idealista|publicidad/i, category: 'Professional Services', type: 'expense' },
      { pattern: /luz|gas.*natural|agua|telefon|internet|endesa|iberdrola|naturgy|movistar|canal.*isabel/i, category: 'Utilities', type: 'expense' },
      { pattern: /recibo.*comunidad/i, category: 'Community Fees', type: 'expense' },
    ];

    let suggestedCategory = null;
    let confidence = 0.0;

    for (const rule of rules) {
      if (rule.pattern.test(descLower)) {
        // Find matching category from provided list
        const matchedCat = categories?.find((c: { name: string; type: string }) => 
          c.name === rule.category && c.type === rule.type
        );
        if (matchedCat) {
          suggestedCategory = matchedCat;
          confidence = 0.85;
          break;
        }
      }
    }

    // If no specific match, suggest based on income/expense
    if (!suggestedCategory && categories) {
      const defaultCat = isIncome
        ? categories.find((c: { name: string }) => c.name === 'Rent Income')
        : categories.find((c: { name: string }) => c.name === 'Repairs & Maintenance');
      
      if (defaultCat) {
        suggestedCategory = defaultCat;
        confidence = 0.5;
      }
    }

    return new Response(JSON.stringify({
      data: {
        suggested_category: suggestedCategory,
        confidence: confidence,
        reasoning: suggestedCategory 
          ? `Based on keywords in "${description.substring(0, 50)}..."`
          : 'No matching pattern found'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: { code: 'CATEGORIZATION_FAILED', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
