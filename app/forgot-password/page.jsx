'use client';

import { useState } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { Input, Button } from '../../components';
import { validators } from '../../lib/validation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({ ...errors, email: null });
    }
  };

  const validateForm = () => {
    const emailError = validators.email(email) || validators.required(email, 'Email');
    if (emailError) {
      setErrors({ email: emailError });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage({ type: 'success', text: res.data.message || 'Password reset link has been sent to your email.' });
      setEmail('');
      setErrors({});
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send password reset email',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '3rem' }}>
      <div className="card">
        <h1>Forgot Password</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {message.text && (
          <div className={`message message-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={handleChange}
            placeholder="Enter your email address"
            required
            error={errors.email}
          />
          <Button type="submit" variant="primary" disabled={loading} loading={loading}>
            Send Reset Link
          </Button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.9rem' }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
