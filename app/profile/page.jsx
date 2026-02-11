'use client';

import { useEffect, useState } from 'react';
import { authApi } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: '',
    password: '',
    currentPassword: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authApi().get('/users/profile');
      const userData = res.data;
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        preferences: userData.preferences ? JSON.stringify(userData.preferences, null, 2) : '',
        password: '',
        currentPassword: '',
      });
    } catch (err) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setMessage({ type: 'error', text: 'Failed to load profile' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      // Parse preferences if provided
      if (formData.preferences.trim()) {
        try {
          updateData.preferences = JSON.parse(formData.preferences);
        } catch (err) {
          setMessage({ type: 'error', text: 'Invalid JSON format for preferences' });
          setSaving(false);
          return;
        }
      }

      // Add password change if provided
      if (formData.password) {
        updateData.password = formData.password;
        updateData.currentPassword = formData.currentPassword;
      }

      const res = await authApi().put('/users/profile', updateData);
      setUser(res.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setFormData({
        ...formData,
        password: '',
        currentPassword: '',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>My Profile</h1>

      {message.text && (
        <div className={message.type === 'success' ? 'success' : 'error'} style={{ marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="form">
          <div>
            <label>
              Name *
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </label>
          </div>

          <div>
            <label>
              Email *
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </label>
          </div>

          <div>
            <label>
              Phone
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </label>
          </div>

          <div>
            <label>
              Preferences (JSON format)
              <textarea
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                rows="4"
                placeholder='{"notifications": true, "preferredTime": "morning"}'
              />
              <small style={{ color: '#666', fontSize: '0.875rem' }}>
                Enter preferences as JSON. Example: {'{"notifications": true, "preferredTime": "morning"}'}
              </small>
            </label>
          </div>

          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

          <h3 style={{ marginBottom: '1rem' }}>Change Password</h3>
          <div>
            <label>
              Current Password
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="Required to change password"
              />
            </label>
          </div>

          <div>
            <label>
              New Password
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave empty to keep current password"
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {user && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3>Account Information</h3>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
