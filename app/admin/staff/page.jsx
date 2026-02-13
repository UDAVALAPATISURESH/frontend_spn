'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import Link from 'next/link';

export default function StaffPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth('admin');
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    specialization: '',
    email: '',
    phone: '',
    password: '',
    serviceIds: [],
  });

  useEffect(() => {
    if (!authLoading) {
      loadStaff();
      loadServices();
    }
  }, [authLoading]);

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Loading...</h2>
        <p>Checking authentication...</p>
      </div>
    );
  }

  const loadStaff = () => {
    authApi()
      .get('/staff')
      .then((res) => setStaff(res.data))
      .catch((err) => console.error('Failed to load staff:', err))
      .finally(() => setLoading(false));
  };

  const loadServices = () => {
    authApi()
      .get('/services')
      .then((res) => setServices(res.data))
      .catch((err) => console.error('Failed to load services:', err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await authApi().put(`/staff/${editing.id}`, formData);
      } else {
        // Create staff first
        const staffRes = await authApi().post('/staff', formData);
        // If password provided, create user account automatically
        if (formData.password && formData.email) {
          try {
            await authApi().post('/admin/staff/create-user', {
              staffId: staffRes.data.id,
              password: formData.password,
            });
          } catch (userErr) {
            console.warn('Could not create user account:', userErr.response?.data?.message || userErr.message);
            // Continue even if user creation fails
          }
        }
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', bio: '', specialization: '', email: '', phone: '', password: '', serviceIds: [] });
      loadStaff();
    } catch (err) {
      alert('Error saving staff: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (staffMember) => {
    setEditing(staffMember);
    setFormData({
      name: staffMember.name,
      bio: staffMember.bio || '',
      specialization: staffMember.specialization || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      password: '', // Don't show password when editing
      serviceIds: staffMember.Services?.map((s) => s.id) || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this staff member?')) return;
    try {
      await authApi().delete(`/staff/${id}`);
      loadStaff();
    } catch (err) {
      alert('Error deleting staff: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Staff</h1>
        <Link href="/admin" className="btn btn-secondary">Back to Dashboard</Link>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: '', bio: '', specialization: '', email: '', phone: '', password: '', serviceIds: [] }); }}>
          Add Staff
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>{editing ? 'Edit Staff' : 'Add New Staff'}</h2>
          <form onSubmit={handleSubmit}>
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
              <label>Email {!editing && '*'}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required={!editing}
              />
            </div>
            {!editing && (
              <div style={{ marginBottom: '1rem' }}>
                <label>Password (for login) *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Staff will use this to login"
                />
                <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  User account will be created automatically with this password
                </small>
              </div>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Specialization</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows="3"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Assign Services</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {services.map((service) => (
                  <label key={service.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, serviceIds: [...formData.serviceIds, service.id] });
                        } else {
                          setFormData({ ...formData, serviceIds: formData.serviceIds.filter((id) => id !== service.id) });
                        }
                      }}
                    />
                    {service.name}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="list">
        {staff.map((s) => (
          <div key={s.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>{s.name}</h3>
                {s.specialization && <p><strong>Specialization:</strong> {s.specialization}</p>}
                {s.email && <p><strong>Email:</strong> {s.email}</p>}
                {s.phone && <p><strong>Phone:</strong> {s.phone}</p>}
                {s.bio && <p>{s.bio}</p>}
                <p><strong>Services:</strong> {s.Services?.map((sv) => sv.name).join(', ') || 'None'}</p>
                <p><strong>Status:</strong> {s.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                <button className="btn btn-secondary" onClick={() => handleEdit(s)}>Edit</button>
                <Link href={`/admin/availability?staffId=${s.id}`} className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                  Manage Availability
                </Link>
                <button className="btn btn-secondary" onClick={() => handleDelete(s.id)}>Deactivate</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
