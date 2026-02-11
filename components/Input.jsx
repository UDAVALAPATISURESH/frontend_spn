'use client';

import { useState } from 'react';

/**
 * Reusable Input component with validation
 */
export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  min,
  max,
  minLength,
  maxLength,
  pattern,
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
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        className={showError ? 'input-error' : ''}
        {...props}
      />
      {showError && <span className="input-error-message">{error}</span>}
    </label>
  );
}
