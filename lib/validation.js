/**
 * Validation utilities for form inputs
 */

export const validators = {
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value) => {
    if (!value) return null; // Let required validator handle empty
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null; // Let required validator handle empty
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      return 'Please enter a valid phone number (10-15 digits)';
    }
    return null;
  },

  minLength: (min) => (value, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return null;
  },

  min: (min) => (value, fieldName = 'This field') => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  max: (max) => (value, fieldName = 'This field') => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num > max) {
      return `${fieldName} must be no more than ${max}`;
    }
    return null;
  },

  positive: (value, fieldName = 'This field') => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },

  date: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    return null;
  },

  futureDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    if (date < now) {
      return 'Date must be in the future';
    }
    return null;
  },

  time: (value) => {
    if (!value) return null;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(value)) {
      return 'Please enter a valid time (HH:MM format)';
    }
    return null;
  },
};

/**
 * Validate a value against multiple validators
 */
export const validate = (value, validatorsList, fieldName) => {
  for (const validator of validatorsList) {
    const error = typeof validator === 'function' 
      ? validator(value, fieldName)
      : validators[validator](value, fieldName);
    if (error) return error;
  }
  return null;
};

/**
 * Validate entire form object
 */
export const validateForm = (formData, schema) => {
  const errors = {};
  for (const [field, rules] of Object.entries(schema)) {
    const value = formData[field];
    const fieldName = rules.label || field;
    const fieldValidators = Array.isArray(rules.validators) ? rules.validators : [rules.validators];
    
    const error = validate(value, fieldValidators, fieldName);
    if (error) {
      errors[field] = error;
    }
  }
  return errors;
};
