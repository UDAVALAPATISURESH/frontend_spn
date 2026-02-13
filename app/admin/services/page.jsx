'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import Link from 'next/link';

export default function ServicesPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth('admin');
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: '',
    price: '',
    staffIds: [],
  });

  useEffect(() => {
    if (!authLoading) {
      loadServices();
      loadStaff();
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

  const loadServices = () => {
    authApi()
      .get('/services')
      .then((res) => setServices(res.data))
      .catch((err) => console.error('Failed to load services:', err))
      .finally(() => setLoading(false));
  };

  const loadStaff = () => {
    authApi()
      .get('/staff')
      .then((res) => setStaff(res.data))
      .catch((err) => console.error('Failed to load staff:', err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        durationMinutes: parseInt(formData.durationMinutes),
        price: parseFloat(formData.price),
      };
      if (editing) {
        await authApi().put(`/services/${editing.id}`, payload);
      } else {
        await authApi().post('/services', payload);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', description: '', durationMinutes: '', price: '', staffIds: [] });
      loadServices();
    } catch (err) {
      alert('Error saving service: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (service) => {
    setEditing(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes.toString(),
      price: service.price.toString(),
      staffIds: service.Staff?.map((s) => s.id) || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this service?')) return;
    try {
      await authApi().delete(`/services/${id}`);
      loadServices();
    } catch (err) {
      alert('Error deleting service: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Services</h1>
        <Link href="/admin" className="btn btn-secondary">Back to Dashboard</Link>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: '', description: '', durationMinutes: '', price: '', staffIds: [] }); }}>
          Add Service
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>{editing ? 'Edit Service' : 'Add New Service'}</h2>
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
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Duration (minutes) *</label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                required
                min="1"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Assign Staff</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {staff.map((s) => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.staffIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, staffIds: [...formData.staffIds, s.id] });
                        } else {
                          setFormData({ ...formData, staffIds: formData.staffIds.filter((id) => id !== s.id) });
                        }
                      }}
                    />
                    {s.name}
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
        {services.map((s) => (
          <div key={s.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>{s.name}</h3>
                {s.description && <p>{s.description}</p>}
                <p><strong>Duration:</strong> {s.durationMinutes} minutes</p>
                <p><strong>Price:</strong> ₹{s.price}</p>
                <p><strong>Staff:</strong> {s.Staff?.map((st) => st.name).join(', ') || 'None'}</p>
                <p><strong>Status:</strong> {s.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => handleEdit(s)}>Edit</button>
                <button className="btn btn-secondary" onClick={() => handleDelete(s.id)}>Deactivate</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
