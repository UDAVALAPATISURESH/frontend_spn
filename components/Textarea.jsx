'use client';

import { useState } from 'react';

/**
 * Reusable Textarea component with validation
 */
export default function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  rows = 3,
  minLength,
  maxLength,
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
      <textarea
        name={name}
        value={value || ''}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        minLength={minLength}
        maxLength={maxLength}
        className={showError ? 'input-error' : ''}
        {...props}
      />
      {showError && <span className="input-error-message">{error}</span>}
    </label>
  );
}
