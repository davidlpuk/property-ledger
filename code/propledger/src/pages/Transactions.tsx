import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../lib/format';
import { Transaction, Category, Property, BankAccount, Attachment } from '../lib/types';
import { 
  Upload, Search, Check, X, Sparkles, Loader2, MessageSquare, ArrowUpDown, FileText, ChevronDown,
  Download, Paperclip, RefreshCw, Wand2, AlertTriangle, Image as ImageIcon, File, Settings2, Filter
} from 'lucide-react';
import { TypeaheadSelect } from '../components/TypeaheadSelect';
import { CategorySelect } from '../components/CategorySelect';
import { NotesPanel } from '../components/NotesPanel';
import { DateRangePicker } from '../components/DateRangePicker';
import { generateTransactionHash, normalizeVendor, detectRecurringTransactions, exportToCSV, exportToPDF } from '../lib/utils';

type StatusFilter = 'all' | 'pending' | 'posted' | 'excluded';
type NotesFilter = 'all' | 'has_notes' | 'no_notes';
type SortDir = 'asc' | 'desc';

interface AISuggestion {
  category: Category | null;
  confidence: number;
  reasoning: string;
  loading: boolean;
}

interface UploadSummary {
  show: boolean;
  imported: number;
  duplicates: number;
  errors: number;
  autoCategorized: number;
  advancedRuleMatches: number;
}

interface CreateRulePrompt {
  show: boolean;
  transaction: Transaction | null;
  category: Category | null;
}

export function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [notesFilter, setNotesFilter] = useState<NotesFilter>('all');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion>({ category: null, confidence: 0, reasoning: '', loading: false });
  
  const [notesTx, setNotesTx] = useState<Transaction | null>(null);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [dateSortDir, setDateSortDir] = useState<SortDir>('desc');
  const [sourceFilter, setSourceFilter] = useState('');
  
  const [uploadSummary, setUploadSummary] = useState<UploadSummary>({ show: false, imported: 0, duplicates: 0, errors: 0, autoCategorized: 0, advancedRuleMatches: 0 });
  const [createRulePrompt, setCreateRulePrompt] = useState<CreateRulePrompt>({ show: false, transaction: null, category: null });
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Column visibility (persisted)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('propledger_tx_columns');
    return saved ? JSON.parse(saved) : { date: true, description: true, property: true, category: true, amount: true, actions: true };
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  
  // Header filters
  const [searchParams] = useSearchParams();
  const [propertyFilter, setPropertyFilter] = useState(() => searchParams.get('property') || '');
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || '');
  const [showPropertyFilter, setShowPropertyFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [txResult, catResult, propResult, bankResult] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('properties').select('*').eq('user_id', user.id).order('name', { ascending: true }),
      supabase.from('bank_accounts').select('*').eq('user_id', user.id),
    ]);
    
    const cats = (catResult.data || []).sort((a, b) => a.name.localeCompare(b.name));
    const props = propResult.data || [];
    const banks = bankResult.data || [];
    let txs = txResult.data || [];
    
    if (txs.length > 0) {
      txs = txs.map(tx => ({
        ...tx,
        property_name: props.find(p => p.id === tx.property_id)?.name,
        category_name: cats.find(c => c.id === tx.category_id)?.name,
        bank_account_name: banks.find(b => b.id === tx.bank_account_id)?.name,
      }));
    }
    setTransactions(txs);
    setCategories(cats);
    setProperties(props);
    setBankAccounts(banks);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedTx && selectedTx.status === 'pending' && !selectedTx.category_id && categories.length > 0) {
      fetchAISuggestion(selectedTx);
    } else if (!selectedTx) {
      setAiSuggestion({ category: null, confidence: 0, reasoning: '', loading: false });
    }
  }, [selectedTx?.id, categories.length]);

  const fetchAISuggestion = async (tx: Transaction) => {
    setAiSuggestion({ category: null, confidence: 0, reasoning: '', loading: true });
    try {
      const { data, error } = await supabase.functions.invoke('categorize-transaction', {
        body: {
          description: tx.description,
          amount: tx.type === 'income' ? Math.abs(Number(tx.amount)) : -Math.abs(Number(tx.amount)),
          categories: categories.map(c => ({ id: c.id, name: c.name, type: c.type })),
        },
      });
      if (error) throw error;
      const result = data?.data || data;
      setAiSuggestion({
        category: result.suggested_category,
        confidence: result.confidence || 0,
        reasoning: result.reasoning || '',
        loading: false,
      });
    } catch (e) {
      console.error('AI suggestion error:', e);
      setAiSuggestion({ category: null, confidence: 0, reasoning: 'Unable to get suggestion', loading: false });
    }
  };

  const sourceFiles = useMemo(() => {
    const sources = new Set(transactions.map(t => t.source).filter(Boolean));
    return Array.from(sources).sort();
  }, [transactions]);

  const filteredTxs = useMemo(() => {
    let result = transactions.filter(tx => {
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      if (searchQuery && !tx.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (sourceFilter && tx.source !== sourceFilter) return false;
      if (dateStart && tx.date < dateStart) return false;
      if (dateEnd && tx.date > dateEnd) return false;
      if (propertyFilter && tx.property_id !== propertyFilter) return false;
      if (categoryFilter === '__uncategorised__' && tx.category_id) return false;
      if (categoryFilter && categoryFilter !== '__uncategorised__' && tx.category_id !== categoryFilter) return false;
      if (notesFilter === 'has_notes' && !tx.notes) return false;
      if (notesFilter === 'no_notes' && tx.notes) return false;
      return true;
    });
    
    result.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return dateSortDir === 'asc' ? cmp : -cmp;
    });
    
    return result;
  }, [transactions, statusFilter, searchQuery, sourceFilter, dateStart, dateEnd, dateSortDir, propertyFilter, categoryFilter, notesFilter]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (sourceFilter) count++;
    if (notesFilter !== 'all') count++;
    if (dateStart || dateEnd) count++;
    return count;
  }, [statusFilter, sourceFilter, notesFilter, dateStart, dateEnd]);

  const clearAllFilters = () => {
    setStatusFilter('all');
    setSourceFilter('');
    setNotesFilter('all');
    setDateStart('');
    setDateEnd('');
  };

  // Toggle column visibility
  const toggleColumn = (col: string) => {
    const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
    if (visibleColumns[col] && visibleCount <= 2) return; // Prevent hiding all
    const updated = { ...visibleColumns, [col]: !visibleColumns[col] };
    setVisibleColumns(updated);
    localStorage.setItem('propledger_tx_columns', JSON.stringify(updated));
  };

  // Detect recurring patterns
  const recurringPatterns = useMemo(() => {
    return detectRecurringTransactions(transactions.filter(t => t.status !== 'excluded'));
  }, [transactions]);

  // Virtualization for large datasets
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredTxs.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 52, // Estimated row height in px
    overscan: 10,
  });

  const updateTransaction = async (id: string, updates: Partial<Transaction>, promptRule = true) => {
    const tx = transactions.find(t => t.id === id);
    await supabase.from('transactions').update(updates).eq('id', id);
    
    // Prompt to create rule on categorization
    if (promptRule && updates.category_id && tx && !tx.category_id) {
      const cat = categories.find(c => c.id === updates.category_id);
      if (cat) {
        setCreateRulePrompt({ show: true, transaction: tx, category: cat });
      }
    }
    
    await loadData();
    setSelectedTx(null);
  };

  const createRuleFromCategorization = async () => {
    if (!createRulePrompt.transaction || !createRulePrompt.category) return;
    
    const desc = createRulePrompt.transaction.description_clean || createRulePrompt.transaction.description || '';
    const pattern = desc.split(' ').slice(0, 3).join(' ').toLowerCase();
    
    await supabase.from('categorisation_rules').insert({
      user_id: user!.id,
      name: `Auto: ${createRulePrompt.category.name}`,
      pattern: pattern,
      match_type: 'contains',
      category_id: createRulePrompt.category.id,
      priority: 0,
      is_active: true,
    });
    
    setCreateRulePrompt({ show: false, transaction: null, category: null });
  };

  const applySuggestion = async () => {
    if (selectedTx && aiSuggestion.category) {
      await updateTransaction(selectedTx.id, { 
        category_id: aiSuggestion.category.id,
        ai_category_suggestion: aiSuggestion.category.id,
        ai_confidence: aiSuggestion.confidence,
      });
    }
  };

  const saveNotes = async (notes: string) => {
    if (!notesTx) return;
    await supabase.from('transactions').update({ notes: notes || null }).eq('id', notesTx.id);
    await loadData();
  };

  // Attachment handling
  const uploadAttachment = async (txId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${txId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(fileName, file);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      alert('Failed to upload attachment');
      return;
    }
    
    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(fileName);
    
    const tx = transactions.find(t => t.id === txId);
    const currentAttachments: Attachment[] = (tx?.attachments as Attachment[]) || [];
    const newAttachment: Attachment = {
      id: Date.now().toString(),
      name: file.name,
      url: urlData.publicUrl,
      type: file.type,
      size: file.size,
      uploaded_at: new Date().toISOString(),
    };
    
    await supabase.from('transactions').update({
      attachments: [...currentAttachments, newAttachment],
    }).eq('id', txId);
    
    await loadData();
    if (selectedTx?.id === txId) {
      setSelectedTx({ ...selectedTx, attachments: [...currentAttachments, newAttachment] });
    }
  };

  // Parse Spanish amount format: -315,51EUR or 1.234,56 EUR
  const parseSpanishAmount = (value: string): number => {
    if (!value) return 0;
    let cleaned = value.toString().trim()
      .replace(/EUR/gi, '')
      .replace(/\s/g, '')
      .replace(/\./g, '') // Remove thousand separators
      .replace(',', '.'); // Convert decimal comma to dot
    return parseFloat(cleaned) || 0;
  };

  // Parse date in DD/MM/YYYY format to ISO
  const parseDate = (value: string): string => {
    if (!value) return new Date().toISOString().split('T')[0];
    const cleaned = value.trim();
    const match = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    }
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
    return new Date().toISOString().split('T')[0];
  };

  // Detect column indices from headers (supports English and Spanish)
  const detectColumns = (headerLine: string): { date: number; description: number; amount: number } | null => {
    const headers = headerLine.split(/[,;\t]/).map(h => h.toLowerCase().replace(/"/g, '').trim());
    
    const dateIdx = headers.findIndex(h => 
      ['date', 'fecha', 'fecha operacion', 'fecha valor', 'f.operacion', 'f.valor'].includes(h)
    );
    const descIdx = headers.findIndex(h => 
      ['description', 'concepto', 'descripcion', 'descripción', 'movimiento', 'detalle'].includes(h)
    );
    const amountIdx = headers.findIndex(h => 
      ['amount', 'importe', 'cantidad', 'monto', 'valor', 'debito', 'credito'].includes(h)
    );
    
    if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) return null;
    return { date: dateIdx, description: descIdx, amount: amountIdx };
  };

  // Parse CSV line respecting quotes
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Fallback raw line parser for unstructured CSVs
  const parseRawLine = (line: string): { date: string; description: string; amount: number } | null => {
    const cleaned = line.replace(/"""/g, '').replace(/""/g, '"').replace(/"/g, '').trim();
    if (!cleaned) return null;
    const dateMatch = cleaned.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (!dateMatch) return null;
    // Try Spanish amount format first
    const spanishAmountMatch = cleaned.match(/-?\d{1,3}(?:\.\d{3})*,\d{2}\s*(?:EUR)?/i);
    let amount = 0;
    if (spanishAmountMatch) {
      amount = parseSpanishAmount(spanishAmountMatch[0]);
    } else {
      const amounts = cleaned.match(/-?\d+\.?\d*/g) || [];
      const numericValues = amounts.map(a => parseFloat(a)).filter(n => !isNaN(n) && Math.abs(n) > 1);
      amount = numericValues[numericValues.length - 2] || numericValues[numericValues.length - 1] || 0;
    }
    if (amount === 0) return null;
    const dateEnd = cleaned.indexOf(dateMatch[1]) + dateMatch[1].length;
    let description = cleaned.substring(dateEnd).replace(/-?\d{1,3}(?:\.\d{3})*,\d{2}\s*(?:EUR)?/gi, '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    description = description.replace(/-?\d+\.?\d*\s*$/g, '').trim();
    return { date: dateMatch[1], description: description || 'Imported transaction', amount };
  };

  const handleFileUpload = async (file: File) => {
    if (!user || !file) return;
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please upload a CSV file');
      return;
    }
    setUploading(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      
      // Get existing hashes
      const existingHashes = new Set(transactions.map(t => t.hash).filter(Boolean));
      
      const newTxs: Array<{
        user_id: string;
        date: string;
        description: string;
        description_clean: string;
        amount: number;
        type: string;
        status: string;
        source: string;
        property_id?: string;
        hash: string;
      }> = [];
      
      let duplicateCount = 0;
      
      // Try structured parsing with column detection
      const columns = detectColumns(lines[0]);
      
      if (columns) {
        // Structured CSV with headers
        for (let i = 1; i < lines.length; i++) {
          const fields = parseCSVLine(lines[i]);
          if (fields.length <= Math.max(columns.date, columns.description, columns.amount)) continue;
          
          const dateStr = fields[columns.date];
          const description = fields[columns.description]?.replace(/"/g, '').trim();
          const amountStr = fields[columns.amount];
          
          if (!dateStr || !description || !amountStr) continue;
          
          const isoDate = parseDate(dateStr);
          const amount = parseSpanishAmount(amountStr);
          
          if (amount === 0) continue;
          
          const hash = generateTransactionHash(isoDate, description, amount);
          
          if (existingHashes.has(hash)) {
            duplicateCount++;
            continue;
          }
          existingHashes.add(hash);
          
          const descClean = normalizeVendor(description);
          const descLower = description.toLowerCase();
          const matchedProp = properties.find(p => 
            p.keywords?.some(kw => descLower.includes(kw.toLowerCase()))
          );
          
          newTxs.push({
            user_id: user.id,
            date: isoDate,
            description,
            description_clean: descClean,
            amount: Math.abs(amount),
            type: amount < 0 ? 'expense' : 'income',
            status: 'pending',
            source: file.name,
            property_id: matchedProp?.id,
            hash,
          });
        }
      } else {
        // Fallback: raw line parsing
        const startIdx = lines[0]?.toLowerCase().includes('date') || lines[0]?.toLowerCase().includes('fecha') ? 1 : 0;
        
        for (let i = startIdx; i < lines.length; i++) {
          const parsed = parseRawLine(lines[i]);
          if (parsed && parsed.amount !== 0) {
            const isoDate = parseDate(parsed.date);
            
            const hash = generateTransactionHash(isoDate, parsed.description, parsed.amount);
            
            if (existingHashes.has(hash)) {
              duplicateCount++;
              continue;
            }
            existingHashes.add(hash);
            
            const descClean = normalizeVendor(parsed.description);
            const descLower = parsed.description.toLowerCase();
            const matchedProp = properties.find(p => 
              p.keywords?.some(kw => descLower.includes(kw.toLowerCase()))
            );
            
            newTxs.push({
              user_id: user.id,
              date: isoDate,
              description: parsed.description,
              description_clean: descClean,
              amount: Math.abs(parsed.amount),
              type: parsed.amount < 0 ? 'income' : 'expense',
              status: 'pending',
              source: file.name,
              property_id: matchedProp?.id,
              hash,
            });
          }
        }
      }

      let importedCount = 0;
      let errorCount = 0;
      let autoCategorizedCount = 0;
      let advancedRuleMatchCount = 0;

      if (newTxs.length > 0) {
        // Fetch ADVANCED rules first (evaluated before standard rules)
        const { data: advancedRulesData } = await supabase
          .from('advanced_rules')
          .select('*')
          .eq('user_id', user.id)
          .eq('enabled', true)
          .order('priority', { ascending: false });
        
        const advancedRules = advancedRulesData || [];
        
        // Fetch standard categorization rules
        const { data: rulesData } = await supabase
          .from('categorisation_rules')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('priority', { ascending: false });
        
        const activeRules = rulesData || [];
        
        // Group transactions by normalized description + month for ordinal logic
        const txGroups: Record<string, typeof newTxs> = {};
        newTxs.forEach(tx => {
          const monthYear = tx.date.substring(0, 7); // YYYY-MM
          const descNorm = tx.description?.toLowerCase().trim() || '';
          const key = `${descNorm}|${monthYear}`;
          if (!txGroups[key]) txGroups[key] = [];
          txGroups[key].push(tx);
        });
        // Sort each group by date
        Object.values(txGroups).forEach(group => group.sort((a, b) => a.date.localeCompare(b.date)));
        
        // Apply rules to each transaction
        const txsWithCategories = newTxs.map(tx => {
          const desc = tx.description?.toLowerCase() || '';
          const txDay = parseInt(tx.date.split('-')[2], 10);
          const monthYear = tx.date.substring(0, 7);
          const descNorm = desc.trim();
          const groupKey = `${descNorm}|${monthYear}`;
          const group = txGroups[groupKey] || [];
          const ordinalPos = group.findIndex(t => t === tx) + 1;
          
          // Check ADVANCED rules first
          for (const advRule of advancedRules) {
            // Check description match
            let descMatches = false;
            const pattern = advRule.description_match.toLowerCase();
            switch (advRule.match_type) {
              case 'contains': descMatches = desc.includes(pattern); break;
              case 'exact': descMatches = desc === pattern; break;
              case 'regex': try { descMatches = new RegExp(advRule.description_match, 'i').test(desc); } catch { descMatches = false; } break;
            }
            if (!descMatches) continue;
            
            // Check provider match (if set)
            if (advRule.provider_match && tx.source !== advRule.provider_match) continue;
            
            // Check date logic
            let dateMatches = false;
            try {
              const logic = advRule.date_logic;
              if (logic.type === 'dayOfMonthRange') {
                dateMatches = txDay >= (logic.start || 1) && txDay <= (logic.end || 31);
              } else if (logic.type === 'ordinalInMonth') {
                dateMatches = ordinalPos === (logic.position || 1);
              }
            } catch {
              dateMatches = false; // Safe fail
            }
            
            if (dateMatches && advRule.property_id) {
              console.log(`[Advanced Rule] "${advRule.rule_name}" matched tx: ${tx.description} -> property: ${advRule.property_id}`);
              advancedRuleMatchCount++;
              return { ...tx, property_id: advRule.property_id };
            }
          }
          
          // Then check standard rules
          for (const rule of activeRules) {
            let matches = false;
            const pattern = rule.pattern.toLowerCase();
            switch (rule.match_type) {
              case 'contains': matches = desc.includes(pattern); break;
              case 'starts_with': matches = desc.startsWith(pattern); break;
              case 'ends_with': matches = desc.endsWith(pattern); break;
              case 'exact': matches = desc === pattern; break;
              case 'regex': try { matches = new RegExp(rule.pattern, 'i').test(desc); } catch { matches = false; } break;
            }
            if (matches) {
              const updates: Record<string, any> = { ...tx };
              if (rule.category_id) updates.category_id = rule.category_id;
              if (rule.property_id && !tx.property_id) updates.property_id = rule.property_id;
              if (rule.category_id || rule.property_id) {
                autoCategorizedCount++;
                return updates;
              }
              break;
            }
          }
          return tx;
        });
        
        const { error } = await supabase.from('transactions').insert(txsWithCategories);
        if (error) {
          console.error('Insert error:', error);
          errorCount = newTxs.length;
        } else {
          importedCount = newTxs.length;
        }
      }
      
      setUploadSummary({
        show: true,
        imported: importedCount,
        duplicates: duplicateCount,
        errors: errorCount,
        autoCategorized: autoCategorizedCount,
        advancedRuleMatches: advancedRuleMatchCount,
      });
      
      supabase.storage.from('bank-files').upload(`${user.id}/${Date.now()}_${file.name}`, file).catch(() => {});
      await loadData();
    } catch (e) {
      console.error('Upload error:', e);
      alert('Error processing file');
    } finally {
      setUploading(false);
    }
  };

  

  // Export functions
  const handleExportCSV = () => {
    const data = filteredTxs.map(tx => ({
      Date: tx.date,
      Description: tx.description,
      Vendor: tx.description_clean || '',
      Amount: tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount),
      Type: tx.type,
      Category: tx.category_name || '',
      Property: tx.property_name || '',
      Status: tx.status,
      Notes: tx.notes || '',
    }));
    exportToCSV(data, `propledger_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const totalIncome = filteredTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = filteredTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    
    const content = `
      <h1>PropLedger Transaction Report</h1>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
      <div class="summary">
        <div class="summary-item">
          <div class="summary-label">Total Income</div>
          <div class="summary-value">${formatCurrency(totalIncome)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Expenses</div>
          <div class="summary-value">${formatCurrency(totalExpense)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Net</div>
          <div class="summary-value">${formatCurrency(totalIncome - totalExpense)}</div>
        </div>
      </div>
      <h2>Transactions (${filteredTxs.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTxs.map(tx => `
            <tr>
              <td>${tx.date}</td>
              <td>${tx.description}</td>
              <td>${tx.category_name || '-'}</td>
              <td class="amount ${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(Number(tx.amount)))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    exportToPDF('PropLedger Transaction Report', content);
    setShowExportMenu(false);
  };

  

  const categoryOptions = categories
    .filter(c => !selectedTx || c.type === selectedTx.type)
    .map(c => ({ value: c.id, label: c.name }));
  
  const propertyOptions = properties.map(p => ({ value: p.id, label: p.name }));

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        disabled={uploading}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Transactions</h1>
        <span className="text-sm text-neutral-500">{filteredTxs.length} transactions</span>
      </div>

      {/* Upload Summary */}
      {uploadSummary.show && (
        <div className="bg-white border border-neutral-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Check className="w-4 h-4 text-semantic-success" />
            <span className="text-sm text-neutral-700">
              Imported: <strong>{uploadSummary.imported}</strong>
              {uploadSummary.advancedRuleMatches > 0 && (
                <span className="text-purple-600 ml-2">{uploadSummary.advancedRuleMatches} advanced</span>
              )}
              {uploadSummary.autoCategorized > 0 && (
                <span className="text-brand-600 ml-2">{uploadSummary.autoCategorized} categorized</span>
              )}
              {uploadSummary.duplicates > 0 && (
                <span className="text-amber-600 ml-2">{uploadSummary.duplicates} skipped</span>
              )}
            </span>
          </div>
          <button onClick={() => setUploadSummary({ ...uploadSummary, show: false })} className="p-1 hover:bg-neutral-100 rounded">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      )}

      {/* Toolbar: Search | Filters | Upload | Export */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 hover:text-neutral-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Button */}
        <div className="relative">
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm ${
              activeFilterCount > 0
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-brand-500 text-white text-xs px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFiltersPanel ? 'rotate-180' : ''}`} />
          </button>

          {showFiltersPanel && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-900">Filters</span>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="text-xs text-brand-600 hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'pending', 'posted', 'excluded'] as StatusFilter[]).map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        statusFilter === status
                          ? 'bg-brand-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Filter */}
              {sourceFiles.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-2">Source</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All sources</option>
                    {sourceFiles.map(src => (
                      <option key={src} value={src!}>{src}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes Filter */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-2">Notes</label>
                <div className="flex gap-2">
                  {([
                    { value: 'all', label: 'All' },
                    { value: 'has_notes', label: 'Has notes' },
                    { value: 'no_notes', label: 'No notes' },
                  ] as { value: NotesFilter; label: string }[]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setNotesFilter(opt.value)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        notesFilter === opt.value
                          ? 'bg-brand-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-2">Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-neutral-400 self-center">to</span>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-sm disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span>{uploading ? 'Uploading...' : 'Upload'}</span>
        </button>

        {/* Export Button */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
              <button onClick={handleExportCSV} className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50">
                CSV
              </button>
              <button onClick={handleExportPDF} className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50">
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {/* Column customization bar */}
        <div className="flex items-center justify-end px-4 py-2 border-b border-neutral-100 bg-neutral-50/50">
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="p-1.5 hover:bg-neutral-200 rounded transition-colors"
              aria-label="Customize columns"
            >
              <Settings2 className="w-4 h-4 text-neutral-500" />
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
                <div className="p-2 text-xs font-medium text-neutral-500 border-b">Show columns</div>
                {[
                  { key: 'date', label: 'Date' },
                  { key: 'description', label: 'Description' },
                  { key: 'property', label: 'Property' },
                  { key: 'category', label: 'Category' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'actions', label: 'Actions' },
                ].map(col => (
                  <label key={col.key} className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key]}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-neutral-300"
                    />
                    <span className="text-sm">{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No transactions found</div>
        ) : (
          <>
            {/* Fixed Header */}
            <div className="grid grid-cols-[80px_1fr_100px] md:grid-cols-[100px_1fr_120px_140px_120px_80px] bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-500">
              {visibleColumns.date && (
                <div className="px-2 md:px-4 py-3">
                  <button 
                    onClick={() => setDateSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1 hover:text-neutral-700"
                  >
                    <span className="hidden md:inline">Date</span>
                    <span className="md:hidden">Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </div>
              )}
              {visibleColumns.description && <div className="px-2 md:px-4 py-3">Description</div>}
              {visibleColumns.property && (
                <div className="px-4 py-3 hidden md:block relative">
                  <button
                    onClick={() => setShowPropertyFilter(!showPropertyFilter)}
                    className={`flex items-center gap-1 hover:text-neutral-700 ${propertyFilter ? 'text-brand-600' : ''}`}
                  >
                    Property <Filter className={`w-3 h-3 ${propertyFilter ? 'fill-brand-600' : ''}`} />
                  </button>
                  {showPropertyFilter && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
                      <button onClick={() => { setPropertyFilter(''); setShowPropertyFilter(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50">All Properties</button>
                      {properties.map(p => (
                        <button key={p.id} onClick={() => { setPropertyFilter(p.id); setShowPropertyFilter(false); }} className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${propertyFilter === p.id ? 'bg-brand-50' : ''}`}>{p.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {visibleColumns.category && (
                <div className="px-4 py-3 hidden md:block relative">
                  <button
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    className={`flex items-center gap-1 hover:text-neutral-700 ${categoryFilter ? 'text-brand-600' : ''}`}
                  >
                    Category <Filter className={`w-3 h-3 ${categoryFilter ? 'fill-brand-600' : ''}`} />
                  </button>
                  {showCategoryFilter && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                      <button onClick={() => { setCategoryFilter(''); setShowCategoryFilter(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50">All Categories</button>
                      <button onClick={() => { setCategoryFilter('__uncategorised__'); setShowCategoryFilter(false); }} className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 italic text-amber-600 ${categoryFilter === '__uncategorised__' ? 'bg-amber-50' : ''}`}>Uncategorised</button>
                      {categories.map(c => (
                        <button key={c.id} onClick={() => { setCategoryFilter(c.id); setShowCategoryFilter(false); }} className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${categoryFilter === c.id ? 'bg-brand-50' : ''}`}>{c.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {visibleColumns.amount && <div className="px-2 md:px-4 py-3 text-right">Amount</div>}
              {visibleColumns.actions && <div className="px-4 py-3 text-center hidden md:block">Actions</div>}
            </div>
            
            {/* Virtualized Rows */}
            <div ref={tableContainerRef} className="max-h-[60vh] overflow-y-auto">
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const tx = filteredTxs[virtualRow.index];
                  return (
                    <div
                      key={tx.id}
                      className="grid grid-cols-[80px_1fr_100px] md:grid-cols-[100px_1fr_120px_140px_120px_80px] border-b border-neutral-100 hover:bg-neutral-50 transition-colors group"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {visibleColumns.date && (
                        <div className="px-2 md:px-4 py-3 text-xs md:text-sm text-neutral-600">{formatDate(tx.date)}</div>
                      )}
                      {visibleColumns.description && (
                        <div className="px-2 md:px-4 py-3 cursor-pointer min-w-0" onClick={() => setSelectedTx(tx)}>
                          <p className="font-medium text-neutral-900 truncate text-sm md:text-base">{tx.description_clean || tx.description}</p>
                          {tx.is_recurring && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                              <RefreshCw className="w-3 h-3" /> Recurring
                            </span>
                          )}
                        </div>
                      )}
                      {visibleColumns.property && (
                        <div className="px-4 py-3 hidden md:block">
                          {tx.property_name ? (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-brand-50 text-brand-700 rounded truncate max-w-full">
                              {tx.property_name}
                            </span>
                          ) : <span className="text-neutral-400">-</span>}
                        </div>
                      )}
                      {visibleColumns.category && (
                        <div className="px-4 py-3 hidden md:block" onClick={(e) => e.stopPropagation()}>
                          <CategorySelect
                            options={categoryOptions}
                            value={tx.category_id || ''}
                            onChange={async (val) => { await updateTransaction(tx.id, { category_id: val || null }); }}
                            placeholder="Select"
                            compact
                          />
                        </div>
                      )}
                      {visibleColumns.amount && (
                        <div className={`px-2 md:px-4 py-3 text-right font-mono font-medium text-xs md:text-sm ${
                          tx.type === 'income' ? 'text-semantic-success' : 'text-neutral-700'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(tx.amount)))}
                        </div>
                      )}
                      {visibleColumns.actions && (
                        <div className="px-4 py-3 hidden md:flex justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setNotesTx(tx); }}
                            className={`p-1 rounded hover:bg-neutral-100 transition-colors ${tx.notes ? 'text-brand-500' : 'text-neutral-300'}`}
                            aria-label="Add notes"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          {((tx.attachments as Attachment[])?.length || 0) > 0 && (
                            <span className="p-1 text-brand-500"><Paperclip className="w-4 h-4" /></span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedTx(null)} />
          <div className="relative bg-white rounded-xl shadow-modal w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Transaction Details</h2>
              <button onClick={() => setSelectedTx(null)} className="p-1 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Date</label>
                <p className="text-neutral-900">{formatDate(selectedTx.date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Description</label>
                <p className="text-neutral-900">{selectedTx.description}</p>
                {selectedTx.description_clean && selectedTx.description_clean !== selectedTx.description && (
                  <p className="text-sm text-neutral-500 mt-1">Vendor: {selectedTx.description_clean}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Amount</label>
                <p className={`text-xl font-mono font-bold ${
                  selectedTx.type === 'income' ? 'text-semantic-success' : 'text-neutral-900'
                }`}>
                  {selectedTx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(selectedTx.amount)))}
                </p>
              </div>
              
              {/* AI Suggestion */}
              {selectedTx.status === 'pending' && !selectedTx.category_id && (
                <div className="p-4 bg-brand-50 rounded-lg border border-brand-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    <span className="text-sm font-medium text-brand-700">AI Suggestion</span>
                  </div>
                  {aiSuggestion.loading ? (
                    <div className="flex items-center gap-2 text-brand-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analyzing...</span>
                    </div>
                  ) : aiSuggestion.category ? (
                    <div className="space-y-2">
                      <p className="text-sm text-brand-600">
                        Suggested: <strong>{aiSuggestion.category.name}</strong>
                        {aiSuggestion.confidence > 0 && ` (${Math.round(aiSuggestion.confidence * 100)}%)`}
                      </p>
                      <button
                        onClick={applySuggestion}
                        className="px-3 py-1 text-sm bg-brand-500 text-white rounded hover:bg-brand-600"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-brand-600">{aiSuggestion.reasoning || 'No suggestion'}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Category</label>
                <CategorySelect
                  options={categoryOptions}
                  value={selectedTx.category_id || ''}
                  onChange={async (val) => { await updateTransaction(selectedTx.id, { category_id: val || null }); }}
                  placeholder="Select category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Property</label>
                <TypeaheadSelect
                  options={propertyOptions}
                  value={selectedTx.property_id || ''}
                  onChange={(val) => updateTransaction(selectedTx.id, { property_id: val || null }, false)}
                  placeholder="Select property"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-2">Attachments</label>
                <div className="space-y-2">
                  {((selectedTx.attachments as Attachment[]) || []).map(att => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg hover:bg-neutral-100"
                    >
                      {att.type.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 text-neutral-500" />
                      ) : (
                        <File className="w-4 h-4 text-neutral-500" />
                      )}
                      <span className="text-sm text-neutral-700 truncate">{att.name}</span>
                    </a>
                  ))}
                </div>
                <label className="mt-2 inline-flex items-center gap-2 px-3 py-2 border border-dashed border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
                  <Paperclip className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-neutral-600">Add attachment</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadAttachment(selectedTx.id, e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            
          </div>
        </div>
      )}

      {/* Notes Panel */}
      <NotesPanel
        isOpen={!!notesTx}
        notes={notesTx?.notes || ''}
        onSave={saveNotes}
        onClose={() => setNotesTx(null)}
        transactionDescription={notesTx?.description}
      />

      {/* Create Rule Prompt */}
      {createRulePrompt.show && createRulePrompt.transaction && createRulePrompt.category && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setCreateRulePrompt({ show: false, transaction: null, category: null })} />
          <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-neutral-900">Create Rule?</h2>
            </div>
            <p className="text-neutral-600 mb-4">
              Create a rule to automatically categorize similar transactions as "{createRulePrompt.category.name}"?
            </p>
            <p className="text-sm text-neutral-500 mb-4 p-2 bg-neutral-50 rounded font-mono">
              Pattern: {(createRulePrompt.transaction.description_clean || createRulePrompt.transaction.description || '').split(' ').slice(0, 3).join(' ').toLowerCase()}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCreateRulePrompt({ show: false, transaction: null, category: null })}
                className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50"
              >
                Skip
              </button>
              <button
                onClick={createRuleFromCategorization}
                className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
