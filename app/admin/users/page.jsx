'use client';

import { useEffect, useState } from 'react';
import { authApi } from '../../../lib/api';
import Link from 'next/link';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Keep original list for filtering
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    authApi()
      .get('/admin/users/all')
      .then((res) => {
        setAllUsers(res.data);
        setUsers(res.data);
      })
      .catch((err) => {
        console.error('Failed to load users:', err);
        setMessage({ type: 'error', text: 'Failed to load users' });
      })
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editing) {
        // Update existing user
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        }
        await authApi().put(`/admin/users/${editing.id}`, updateData);
        setMessage({ type: 'success', text: 'User updated successfully!' });
      } else {
        // Create new user
        await authApi().post('/admin/users/create', formData);
        setMessage({ type: 'success', text: `${formData.role === 'admin' ? 'Admin' : 'Customer'} account created successfully!` });
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'customer' });
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || (editing ? 'Failed to update user account' : 'Failed to create user account'),
      });
    }
  };

  const handleEdit = (user) => {
    setEditing(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      phone: user.phone || '',
      role: user.role,
    });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user account? This action cannot be undone.')) {
      return;
    }

    try {
      await authApi().delete(`/admin/users/${userId}`);
      setMessage({ type: 'success', text: 'User deleted successfully!' });
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete user',
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Users</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/admin" className="btn btn-secondary">Back to Dashboard</Link>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setMessage({ type: '', text: '' }); }}>
            Create User
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`card ${message.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>{editing ? 'Edit User' : 'Create New User'}</h2>
          <form onSubmit={handleSubmit} className="form">
            <div style={{ marginBottom: '1rem' }}>
              <label>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Password {editing ? '(leave empty to keep current)' : '*'}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editing}
                minLength={editing ? 0 : 6}
                placeholder={editing ? 'Leave empty to keep current password' : 'Minimum 6 characters'}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editing ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setFormData({ name: '', email: '', password: '', phone: '', role: 'customer' });
                  setMessage({ type: '', text: '' });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2>All Users ({users.length})</h2>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setUsers([...allUsers].sort((a, b) => (a.role > b.role ? 1 : -1)))}
            className="btn btn-secondary"
          >
            Sort by Role
          </button>
          <button
            onClick={() => setUsers(allUsers.filter((u) => u.role === 'admin'))}
            className="btn btn-secondary"
          >
            Show Admins Only
          </button>
          <button
            onClick={() => setUsers(allUsers.filter((u) => u.role === 'customer'))}
            className="btn btn-secondary"
          >
            Show Customers Only
          </button>
          <button onClick={() => setUsers(allUsers)} className="btn btn-secondary">
            Show All
          </button>
        </div>

        <div className="list">
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3>
                      {user.name}
                      <span
                        style={{
                          marginLeft: '1rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: user.role === 'admin' ? '#dc2626' : user.role === 'staff' ? '#2563eb' : '#059669',
                          color: 'white',
                        }}
                      >
                        {user.role.toUpperCase()}
                      </span>
                    </h3>
                    <p><strong>Email:</strong> {user.email}</p>
                    {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(user)}
                      style={{ fontSize: '0.875rem' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDelete(user.id)}
                      style={{ fontSize: '0.875rem', background: '#dc2626', color: 'white' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
