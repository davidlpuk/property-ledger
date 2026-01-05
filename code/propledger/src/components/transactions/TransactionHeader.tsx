import React, { useRef } from 'react';
import { Search, Filter, Upload, Download, ChevronDown } from 'lucide-react';

interface TransactionHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilterCount: number;
  onFiltersClick: () => void;
  onUploadClick: () => void;
  onExportClick: () => void;
  showExportMenu: boolean;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onCloseExportMenu: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

export function TransactionHeader({
  searchQuery,
  onSearchChange,
  activeFilterCount,
  onFiltersClick,
  onUploadClick,
  onExportClick,
  showExportMenu,
  onExportCSV,
  onExportPDF,
  onCloseExportMenu,
  fileInputRef,
  onFileChange,
  uploading,
}: TransactionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <h1 className="text-2xl font-bold text-neutral-900">Transactions</h1>
      
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2 w-48 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filters Button */}
        <button
          onClick={onFiltersClick}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
            activeFilterCount > 0
              ? 'border-brand-300 bg-brand-50 text-brand-700'
              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-brand-500 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onFileChange}
          className="hidden"
        />
        <button
          onClick={onUploadClick}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>

        {/* Export Button */}
        <div className="relative">
          <button
            onClick={onExportClick}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={onCloseExportMenu} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={onExportCSV}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={onExportPDF}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  Export as PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
