import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatNumber, formatDate } from '../lib/format';
import { Transaction, Property, Category } from '../lib/types';
import { Shield, AlertTriangle, FileText, Download, CheckCircle, Clock, Calendar, X } from 'lucide-react';

export function Taxes() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [showUncategorised, setShowUncategorised] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    const [txResult, propResult, catResult] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user!.id).eq('status', 'posted'),
      supabase.from('properties').select('*').eq('user_id', user!.id).order('name', { ascending: true }),
      supabase.from('categories').select('*'),
    ]);
    setTransactions(txResult.data || []);
    setProperties(propResult.data || []);
    setCategories((catResult.data || []).sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  }

  const currentYear = new Date().getFullYear();
  const yearTxs = transactions.filter(t => t.date.startsWith(currentYear.toString()));
  
  // Uncategorised transactions
  const uncategorisedTxs = yearTxs.filter(t => !t.category_id);
  
  // Get transactions for selected quarter
  const getQuarterMonths = (q: number) => {
    const start = (q - 1) * 3 + 1;
    return [start, start + 1, start + 2];
  };
  
  const quarterMonths = getQuarterMonths(selectedQuarter);
  const quarterTxs = yearTxs.filter(t => {
    const month = parseInt(t.date.split('-')[1]);
    return quarterMonths.includes(month);
  });

  const totalIncome = yearTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = yearTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  const netIncome = totalIncome - totalExpenses;
  const stressedZoneProps = properties.filter(p => p.is_stressed_zone).length;

  // Calculate amortization (3% of construction value)
  const totalAmortization = properties.reduce((sum, p) => {
    return sum + (p.construction_value ? p.construction_value * 0.03 : 0);
  }, 0);

  // Modelo 303 calculations for the quarter
  const quarterIncome = quarterTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const quarterExpenses = quarterTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  
  // Calculate IVA for commercial/service transactions (21%)
  const ivaDeducible = quarterTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => {
      const cat = categories.find(c => c.id === t.category_id);
      if (cat && cat.iva_rate > 0) {
        return sum + (Number(t.amount) * (cat.iva_rate / 100) / (1 + cat.iva_rate / 100));
      }
      return sum;
    }, 0);

  // Residential rentals are IVA exempt, so IVA repercutido is typically 0
  const ivaRepercutido = 0; // Residential rentals are exempt
  const ivaDifference = ivaRepercutido - ivaDeducible;

  const exportData = () => {
    const csvContent = [
      ['Date', 'Description', 'Type', 'Amount', 'Status'].join(','),
      ...yearTxs.map(tx => [
        tx.date,
        `"${tx.description || ''}"`,
        tx.type,
        tx.amount,
        tx.status,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propledger_transactions_${currentYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateModelo303 = () => {
    const quarterLabel = `${currentYear}T${selectedQuarter}`;
    const quarterName = ['', 'Enero-Marzo', 'Abril-Junio', 'Julio-Septiembre', 'Octubre-Diciembre'][selectedQuarter];
    
    const reportContent = `
================================================================================
                           MODELO 303 - BORRADOR
                    Autoliquidacion IVA Trimestral
================================================================================

PERIODO: ${quarterLabel} (${quarterName} ${currentYear})
GENERADO: ${new Date().toLocaleDateString('es-ES')} - PropLedger

--------------------------------------------------------------------------------
IDENTIFICACION DEL DECLARANTE
--------------------------------------------------------------------------------
NIF: [COMPLETAR]
Apellidos y nombre o razon social: [COMPLETAR]

================================================================================
                        IVA DEVENGADO (Repercutido)
================================================================================

01. Base imponible al tipo general (21%)................ ${formatNumber(0)}
02. Cuota (21% de casilla 01)........................... ${formatNumber(0)}
03. Base imponible al tipo reducido (10%)............... ${formatNumber(0)}
04. Cuota (10% de casilla 03)........................... ${formatNumber(0)}
05. Base imponible al tipo superreducido (4%)........... ${formatNumber(0)}
06. Cuota (4% de casilla 05)............................ ${formatNumber(0)}

    * Alquileres residenciales: EXENTOS de IVA (Art. 20.1.23 LIVA)

27. TOTAL CUOTA DEVENGADA [01+02+03+04+05+06]........... ${formatNumber(ivaRepercutido)}

================================================================================
                        IVA DEDUCIBLE
================================================================================

28. Base imponible cuotas soportadas.................... ${formatNumber(quarterExpenses)}
29. Cuotas soportadas (estimado)....................... ${formatNumber(ivaDeducible)}
30. Cuotas soportadas en adquisiciones intracomunitarias ${formatNumber(0)}
31. Cuotas de importaciones............................ ${formatNumber(0)}

45. TOTAL A DEDUCIR [29+30+31].......................... ${formatNumber(ivaDeducible)}

================================================================================
                        RESULTADO
================================================================================

46. DIFERENCIA [27-45]................................. ${formatNumber(ivaDifference)}
47. Cuotas a compensar de periodos anteriores.......... ${formatNumber(0)}
48. Regularizacion cuotas Art. 80.cinco.5a LIVA....... ${formatNumber(0)}

69. RESULTADO LIQUIDACION [46-47+48]................... ${formatNumber(ivaDifference)}

    ${ivaDifference < 0 ? 'A COMPENSAR EN PERIODOS SIGUIENTES' : ivaDifference > 0 ? 'A INGRESAR' : 'SIN ACTIVIDAD GRAVADA'}

================================================================================
                        RESUMEN DE OPERACIONES
================================================================================

Transacciones del periodo: ${quarterTxs.length}
  - Ingresos totales: ${formatCurrency(quarterIncome)}
  - Gastos totales: ${formatCurrency(quarterExpenses)}

Propiedades registradas: ${properties.length}
  - En zona tensionada: ${stressedZoneProps}

--------------------------------------------------------------------------------
NOTA IMPORTANTE:
Este es un BORRADOR generado automaticamente por PropLedger.
Debe ser revisado y completado por un asesor fiscal antes de su presentacion.
Para alquileres residenciales exclusivos, normalmente NO hay obligacion de
presentar Modelo 303 al estar exentos de IVA.
--------------------------------------------------------------------------------

Generado por PropLedger - https://propledger.app
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Modelo303_Borrador_${quarterLabel}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-neutral-900">Taxes & Compliance</h1>

      {/* Compliance Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Shield className="w-6 h-6 text-semantic-success" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">Veri*Factu Status</h3>
              <p className="text-sm text-neutral-500">E-invoicing compliance</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-semantic-warning" />
            <span className="text-sm font-medium text-semantic-warning">Deadline: January 2027</span>
          </div>
          <p className="text-sm text-neutral-600">
            Small landlords with residential rentals are typically exempt from Veri*Factu requirements.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-semantic-info" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">SII Reporting</h3>
              <p className="text-sm text-neutral-500">Real-time VAT reporting</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-semantic-success" />
            <span className="text-sm font-medium text-semantic-success">Not Required</span>
          </div>
          <p className="text-sm text-neutral-600">
            SII only applies to businesses with turnover above 6.000.000 EUR.
          </p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">{currentYear} Tax Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <p className="text-sm text-neutral-500 mb-1">Gross Rental Income</p>
            <p className="text-2xl font-bold text-neutral-900 font-mono">{formatCurrency(totalIncome)}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 mb-1">Deductible Expenses</p>
            <p className="text-2xl font-bold text-neutral-900 font-mono">{formatCurrency(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 mb-1">Amortization (3%)</p>
            <p className="text-2xl font-bold text-neutral-900 font-mono">{formatCurrency(totalAmortization)}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 mb-1">Net Taxable Income</p>
            <p className="text-2xl font-bold text-semantic-success font-mono">
              {formatCurrency(Math.max(0, netIncome - totalAmortization))}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 mb-1">Uncategorised</p>
            <button
              onClick={() => setShowUncategorised(true)}
              className={`text-2xl font-bold font-mono hover:underline ${
                uncategorisedTxs.length > 0 ? 'text-semantic-warning' : 'text-neutral-400'
              }`}
            >
              {uncategorisedTxs.length} txn{uncategorisedTxs.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* IRPF Deductions */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">IRPF Deduction Rates</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div>
              <p className="font-medium text-neutral-900">Standard Long-term Rental</p>
              <p className="text-sm text-neutral-500">Basic deduction for residential rentals</p>
            </div>
            <span className="text-xl font-bold text-brand-500">50%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div>
              <p className="font-medium text-neutral-900">Recent Renovation</p>
              <p className="text-sm text-neutral-500">Renovation completed in prior 3 years</p>
            </div>
            <span className="text-xl font-bold text-brand-500">60%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div>
              <p className="font-medium text-neutral-900">Young Tenant (18-35)</p>
              <p className="text-sm text-neutral-500">Or social housing rental</p>
            </div>
            <span className="text-xl font-bold text-brand-500">70%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-brand-50 rounded-lg border border-brand-100">
            <div>
              <p className="font-medium text-brand-900">Zona Tensionada - Reduced Rent</p>
              <p className="text-sm text-brand-600">New contracts with rent 5%+ below previous</p>
            </div>
            <span className="text-xl font-bold text-brand-500">90%</span>
          </div>
        </div>
        {stressedZoneProps > 0 && (
          <div className="mt-4 p-4 bg-brand-50 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-brand-700">
              You have {stressedZoneProps} {stressedZoneProps === 1 ? 'property' : 'properties'} in a Zona Tensionada. 
              You may qualify for enhanced deductions up to 90%.
            </p>
          </div>
        )}
      </div>

      {/* IVA Information */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">IVA (VAT) Rates</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500">Rental Type</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-neutral-500">IVA Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <tr>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">Residential (Exclusive Use)</p>
                  <p className="text-sm text-neutral-500">Including furniture, garage if leased jointly</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block px-3 py-1 bg-green-50 text-green-700 font-medium rounded">
                    Exempt (0%)
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">With Hotel-like Services</p>
                  <p className="text-sm text-neutral-500">Cleaning, laundry, linen provided</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 font-medium rounded">
                    10%
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">Commercial / Mixed Use</p>
                  <p className="text-sm text-neutral-500">Or lessee is a business</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block px-3 py-1 bg-red-50 text-red-700 font-medium rounded">
                    21%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">Reports & Export</h2>
        
        {/* Quarter Selector for Modelo 303 */}
        <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-brand-500" />
            <span className="font-medium text-neutral-900">Select Quarter for Tax Reports</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedQuarter === q
                    ? 'bg-brand-500 text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                Q{q}
              </button>
            ))}
          </div>
          <p className="text-sm text-neutral-500 mt-2">
            Selected: {currentYear} Q{selectedQuarter} ({quarterTxs.length} transactions)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={exportData}
            className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-left"
          >
            <Download className="w-5 h-5 text-brand-500" />
            <div>
              <p className="font-medium text-neutral-900">Transaction Export</p>
              <p className="text-sm text-neutral-500">CSV for {currentYear}</p>
            </div>
          </button>
          <button
            onClick={generateModelo303}
            className="flex items-center gap-3 p-4 border border-brand-200 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors text-left"
          >
            <FileText className="w-5 h-5 text-brand-500" />
            <div>
              <p className="font-medium text-brand-900">Modelo 303 Draft</p>
              <p className="text-sm text-brand-600">Q{selectedQuarter} {currentYear} IVA Return</p>
            </div>
          </button>
          <div className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg opacity-50 cursor-not-allowed">
            <FileText className="w-5 h-5 text-neutral-400" />
            <div>
              <p className="font-medium text-neutral-600">SII Export</p>
              <p className="text-sm text-neutral-400">Not required for residential</p>
            </div>
          </div>
        </div>
      </div>

      {/* Uncategorised Transactions Modal */}
      {showUncategorised && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowUncategorised(false)} />
          <div className="relative bg-white rounded-xl shadow-modal w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">
                Uncategorised Transactions ({uncategorisedTxs.length})
              </h2>
              <button onClick={() => setShowUncategorised(false)} className="p-1 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {uncategorisedTxs.length === 0 ? (
                <p className="text-center text-neutral-500 py-8">All transactions are categorised!</p>
              ) : (
                <div className="space-y-3">
                  {uncategorisedTxs.map(tx => (
                    <div key={tx.id} className="p-3 bg-neutral-50 rounded-lg flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900 truncate">{tx.description}</p>
                        <p className="text-sm text-neutral-500">{formatDate(tx.date)}</p>
                      </div>
                      <p className={`font-mono font-medium ml-4 ${
                        tx.type === 'income' ? 'text-semantic-success' : 'text-neutral-700'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(tx.amount)))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-neutral-200 bg-neutral-50">
              <p className="text-sm text-neutral-600">
                Go to Transactions page to categorise these items for accurate tax reporting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
