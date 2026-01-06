import React from 'react';
import { BaseSelect, Option } from './Select';

interface CategorySelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function CategorySelect({
  options,
  value,
  onChange,
  placeholder = 'Select category',
  className = '',
  disabled = false,
  compact = false
}: CategorySelectProps) {
  return (
    <BaseSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      compact={compact}
      showClearOption
      clearLabel="Clear category"
    />
  );
}
