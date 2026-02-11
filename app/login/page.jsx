'use client';

import { useState } from 'react';
import { api } from '../../lib/api';
import { Input, Button } from '../../components';
import { validators } from '../../lib/validation';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
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
    
    // Email validation
    const emailError = validators.email(form.email) || validators.required(form.email, 'Email');
    if (emailError) newErrors.email = emailError;
    
    // Password validation
    const passwordError = validators.required(form.password, 'Password');
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
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      if (res.data.user?.role) {
        localStorage.setItem('role', res.data.user.role);
      }
      const role = res.data.user?.role || 'customer';
      if (role === 'admin') {
        window.location.href = '/admin';
      } else if (role === 'staff') {
        window.location.href = '/staff/dashboard';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '3rem' }}>
      <div className="card">
        <h1 style={{ marginBottom: '1.5rem' }}>Login</h1>
        <form onSubmit={handleSubmit} className="form">
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
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            error={errors.password}
          />
          {error && <div className="error">{error}</div>}
          <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
            Login
          </Button>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a href="/forgot-password" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.9rem' }}>
              Forgot Password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

