'use client';

import { useState } from 'react';
import { validateForm } from '../lib/validation';

/**
 * Reusable Form component with validation
 */
export default function Form({
  children,
  onSubmit,
  validationSchema,
  initialValues = {},
  className = '',
}) {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = async (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Validate field on blur if schema exists
    if (validationSchema && validationSchema[name]) {
      const fieldSchema = validationSchema[name];
      const fieldValue = formData[name];
      const fieldValidators = Array.isArray(fieldSchema.validators) 
        ? fieldSchema.validators 
        : [fieldSchema.validators];
      
      // Import validators
      const { validate } = await import('../lib/validation');
      const error = validate(fieldValue, fieldValidators, fieldSchema.label || name);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      } else {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({});

    // Validate entire form
    if (validationSchema) {
      const formErrors = validateForm(formData, validationSchema);
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`form ${className}`}>
      {typeof children === 'function'
        ? children({ formData, handleChange, handleBlur, errors, touched, isSubmitting })
        : children}
    </form>
  );
}
