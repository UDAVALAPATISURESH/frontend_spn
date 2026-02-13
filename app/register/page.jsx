'use client';

import { useState } from 'react';
import { api } from '../../lib/api';
import { Input, Button } from '../../components';
import { validators } from '../../lib/validation';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    const nameError = validators.required(form.name, 'Name') || validators.minLength(2)(form.name, 'Name');
    if (nameError) newErrors.name = nameError;
    
    // Email validation
    const emailError = validators.email(form.email) || validators.required(form.email, 'Email');
    if (emailError) newErrors.email = emailError;
    
    // Phone validation (optional but validate if provided)
    if (form.phone) {
      const phoneError = validators.phone(form.phone);
      if (phoneError) newErrors.phone = phoneError;
    }
    
    // Password validation
    const passwordError = validators.required(form.password, 'Password') || 
                         validators.minLength(6)(form.password, 'Password');
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/register', form);
      // Redirect to login page after successful registration
      setError('');
      alert('Registration successful! Please login to continue.');
      window.location.href = '/login';
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '3rem' }}>
      <div className="card">
        <h1 style={{ marginBottom: '1.5rem' }}>Create Account</h1>
        <form onSubmit={handleSubmit} className="form">
          <Input
            label="Name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
            error={errors.name}
            minLength={2}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            error={errors.email}
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter your phone number (optional)"
            error={errors.phone}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            required
            error={errors.password}
            minLength={6}
          />
          {error && <div className="error">{error}</div>}
          <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
            Sign Up
          </Button>
        </form>
      </div>
    </div>
  );
}

