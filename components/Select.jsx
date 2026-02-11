'use client';

import { useState } from 'react';

/**
 * Reusable Select component with validation
 */
export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  required = false,
  error,
  disabled = false,
  className = '',
  ...props
}) {
  const [touched, setTouched] = useState(false);
  const showError = touched && error;

  return (
    <label className={`input-wrapper ${className}`}>
      {label && (
        <span className="input-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </span>
      )}
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        required={required}
        disabled={disabled}
        className={showError ? 'input-error' : ''}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {showError && <span className="input-error-message">{error}</span>}
    </label>
  );
}
