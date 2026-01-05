import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate hash for duplicate detection
export function generateTransactionHash(date: string, description: string, amount: number): string {
  const normalized = `${date}|${description.toLowerCase().trim()}|${Math.abs(amount).toFixed(2)}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Normalize vendor/description
export function normalizeVendor(description: string): string {
  let cleaned = description
    .replace(/\b\d{6,}\b/g, '')
    .replace(/\b\d{2}\/\d{2}\/\d{2,4}\b/g, '')
    .replace(/\bREF[:\s]*\S+/gi, '')
    .replace(/\b[A-Z]{2}\d{10,}\b/g, '')
    .replace(/\bDD\b/gi, '')
    .replace(/\bFT\b/gi, '')
    .replace(/\bBGC\b/gi, '')
    .replace(/\b\*{3,}\d+\b/g, '')
    .replace(/[*]{2,}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  cleaned = cleaned
    .toLowerCase()
    .split(' ')
    .filter(w => w.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return cleaned || description;
}

// Detect recurring transactions
export interface RecurrencePattern {
  vendor: string;
  avgAmount: number;
  avgInterval: number;
  count: number;
  nextExpected: string;
  transactionIds: string[];
}

export function detectRecurringTransactions(
  transactions: Array<{
    id: string;
    description_clean?: string;
    description?: string;
    amount: number;
    date: string;
    type: string;
  }>
): RecurrencePattern[] {
  const byVendor: Record<string, typeof transactions> = {};
  
  transactions.forEach(tx => {
    const vendor = (tx.description_clean || tx.description || '').toLowerCase().trim();
    if (!vendor) return;
    if (!byVendor[vendor]) byVendor[vendor] = [];
    byVendor[vendor].push(tx);
  });
  
  const patterns: RecurrencePattern[] = [];
  
  Object.entries(byVendor).forEach(([vendor, txs]) => {
    if (txs.length < 3) return;
    
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const amounts = sorted.map(t => Math.abs(Number(t.amount)));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVariance = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.1);
    
    if (!amountVariance) return;
    
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const d1 = new Date(sorted[i - 1].date);
      const d2 = new Date(sorted[i].date);
      intervals.push((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const intervalVariance = intervals.every(i => Math.abs(i - avgInterval) < 5);
    
    if (!intervalVariance || avgInterval < 7) return;
    
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const nextExpected = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);
    
    patterns.push({
      vendor: txs[0].description_clean || txs[0].description || vendor,
      avgAmount,
      avgInterval,
      count: txs.length,
      nextExpected: nextExpected.toISOString().split('T')[0],
      transactionIds: sorted.map(t => t.id),
    });
  });
  
  return patterns.sort((a, b) => b.count - a.count);
}

// Export to CSV
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(h => {
        const val = row[h];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Export to PDF
export function exportToPDF(title: string, content: string): void {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
        h2 { color: #444; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .amount { text-align: right; font-family: monospace; }
        .summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }
}
