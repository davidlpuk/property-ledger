import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X, Loader2 } from 'lucide-react';

export interface Option {
    value: string;
    label: string;
}

interface BaseSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => Promise<void> | void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    compact?: boolean;
    showClearOption?: boolean;
    clearLabel?: string;
    isLoading?: boolean;
}

export function BaseSelect({
    options,
    value,
    onChange,
    placeholder = 'Select',
    className = '',
    disabled = false,
    compact = false,
    showClearOption = false,
    clearLabel = 'Clear',
    isLoading = false,
}: BaseSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.value === value);

    // Filter and sort options alphabetically (case-insensitive)
    const filteredOptions = options
        .filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

    // Build options list with optional clear option
    const allOptions = showClearOption
        ? [
            { value: '', label: clearLabel, isClear: true },
            ...filteredOptions.map(o => ({ ...o, isClear: false }))
        ]
        : filteredOptions;

    // Update dropdown position when opening
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, [isOpen]);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (
                buttonRef.current && !buttonRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                closeDropdown();
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === 'Escape' && isOpen) {
                closeDropdown();
            }
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);

    // Focus input and set highlight when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setHighlightIndex(value ? allOptions.findIndex(o => o.value === value) : 0);
        }
    }, [isOpen, value, allOptions]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (listRef.current && highlightIndex >= 0) {
            const items = listRef.current.querySelectorAll('[data-option]');
            items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightIndex]);

    const closeDropdown = useCallback(() => {
        setIsOpen(false);
        setSearch('');
        setHighlightIndex(-1);
    }, []);

    const handleSelect = useCallback(async (optValue: string) => {
        if (saving || disabled) return;
        setSaving(true);
        try {
            await onChange(optValue);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 500);
        } catch (e) {
            console.error('Select error:', e);
        } finally {
            setSaving(false);
            closeDropdown();
        }
    }, [onChange, saving, disabled, closeDropdown]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightIndex(i => Math.min(i + 1, allOptions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightIndex >= 0 && highlightIndex < allOptions.length) {
                    handleSelect(allOptions[highlightIndex].value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                closeDropdown();
                break;
            case 'Tab':
                closeDropdown();
                break;
        }
    };

    // Truncate label with ellipsis for compact mode
    const displayLabel = selectedOption?.label || '';
    const truncatedLabel = displayLabel.length > 20
        ? displayLabel.substring(0, 20) + '...'
        : displayLabel;

    // Dynamic button class based on props
    const buttonClass = `w-full flex items-center justify-between border rounded-lg bg-white text-left transition-all ${compact ? 'px-2 py-1 text-xs min-w-28' : 'px-4 py-2'
        } ${disabled || saving || isLoading
            ? 'border-neutral-100 bg-neutral-50 cursor-not-allowed opacity-60'
            : 'border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500'
        } ${showSuccess ? 'ring-2 ring-semantic-success ring-opacity-50' : ''}`;

    const dropdownContent = (
        <div
            ref={dropdownRef}
            style={{
                position: 'absolute',
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: Math.max(dropdownPos.width, 200),
                zIndex: 9999,
            }}
            className="bg-white border border-neutral-200 rounded-lg shadow-lg max-h-72 overflow-hidden"
            role="listbox"
            onKeyDown={handleKeyDown}
        >
            <div className="p-2 border-b border-neutral-100">
                <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setHighlightIndex(0);
                    }}
                    placeholder="Type to filter..."
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                    aria-label="Filter options"
                />
            </div>
            <div ref={listRef} className="max-h-52 overflow-y-auto">
                {allOptions.map((opt, idx) => (
                    <React.Fragment key={opt.value || 'clear'}>
                        <button
                            type="button"
                            data-option
                            onClick={() => handleSelect(opt.value)}
                            className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm transition-colors ${highlightIndex === idx ? 'bg-brand-50' : 'hover:bg-neutral-50'
                                } ${(opt as { isClear?: boolean }).isClear ? 'text-neutral-500' : 'text-neutral-900'}`}
                            role="option"
                            aria-selected={opt.value === value}
                        >
                            <span className="flex items-center gap-2">
                                {(opt as { isClear?: boolean }).isClear && <X className="w-3 h-3" />}
                                {opt.label}
                            </span>
                            {opt.value === value && !(opt as { isClear?: boolean }).isClear && (
                                <Check className="w-4 h-4 text-brand-500" />
                            )}
                        </button>
                        {(opt as { isClear?: boolean }).isClear && <div className="border-b border-neutral-100 mx-2" />}
                    </React.Fragment>
                ))}
                {filteredOptions.length === 0 && search && (
                    <p className="px-4 py-3 text-sm text-neutral-500 text-center">No matches found</p>
                )}
            </div>
        </div>
    );

    return (
        <div className={`relative ${className}`}>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && !saving && !isLoading && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                disabled={disabled || saving || isLoading}
                className={buttonClass}
                title={displayLabel.length > 20 ? displayLabel : undefined}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={selectedOption ? 'text-neutral-900 truncate' : 'text-neutral-400'}>
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                        </span>
                    ) : saving ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </span>
                    ) : selectedOption ? truncatedLabel : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Render dropdown via Portal to escape stacking contexts */}
            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
}
