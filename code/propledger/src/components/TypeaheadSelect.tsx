import React from 'react';
import { BaseSelect, Option } from './Select';

interface TypeaheadSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function TypeaheadSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  compact = false,
}: TypeaheadSelectProps) {
  // Wrap sync onChange to work with BaseSelect's async signature
  const handleChange = async (newValue: string) => {
    onChange(newValue);
  };

  return (
    <BaseSelect
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      compact={compact}
      showClearOption
      clearLabel="Clear selection"
    />
  );
}
