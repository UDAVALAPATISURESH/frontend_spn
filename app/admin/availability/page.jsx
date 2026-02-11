'use client';

import { useEffect, useState } from 'react';
import { authApi } from '../../../lib/api';
import Link from 'next/link';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function AvailabilityPage() {
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
  });
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadStaff();
    // Check for staffId in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const staffIdParam = params.get('staffId');
      if (staffIdParam) {
        setTimeout(() => setSelectedStaff(parseInt(staffIdParam)), 100);
      }
    }
  }, []);

  useEffect(() => {
    if (staff.length > 0 && !selectedStaff) {
      setSelectedStaff(staff[0].id);
    }
  }, [staff]);

  useEffect(() => {
    if (selectedStaff) {
      loadAvailability(selectedStaff);
    }
  }, [selectedStaff]);

  const loadStaff = async () => {
    try {
      const res = await authApi().get('/staff');
      setStaff(res.data);
      if (res.data.length > 0 && !selectedStaff) {
        setSelectedStaff(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (staffId) => {
    try {
      const res = await authApi().get(`/availability/staff/${staffId}`);
      setAvailability(res.data);
    } catch (err) {
      console.error('Failed to load availability:', err);
      setAvailability([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editing) {
        await authApi().put(`/availability/${editing.id}`, {
          dayOfWeek: parseInt(formData.dayOfWeek),
          startTime: formData.startTime,
          endTime: formData.endTime,
        });
        setMessage({ type: 'success', text: 'Schedule updated successfully!' });
      } else {
        await authApi().post(`/availability/staff/${selectedStaff}/schedule`, {
          dayOfWeek: parseInt(formData.dayOfWeek),
          startTime: formData.startTime,
          endTime: formData.endTime,
        });
        setMessage({ type: 'success', text: 'Schedule added successfully!' });
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ dayOfWeek: '', startTime: '', endTime: '' });
      loadAvailability(selectedStaff);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save schedule',
      });
    }
  };

  const handleEdit = (schedule) => {
    setEditing(schedule);
    setFormData({
      dayOfWeek: schedule.dayOfWeek.toString(),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this schedule?')) return;
    try {
      await authApi().delete(`/availability/${id}`);
      setMessage({ type: 'success', text: 'Schedule deleted successfully!' });
      loadAvailability(selectedStaff);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete schedule',
      });
    }
  };

  const handleBulkSet = async () => {
    if (!confirm('This will replace all existing schedules for this staff member. Continue?')) {
      return;
    }

    const schedules = [];
    for (let day = 0; day <= 6; day++) {
      const daySchedule = availability.find((a) => a.dayOfWeek === day);
      if (daySchedule) {
        schedules.push({
          dayOfWeek: day,
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime,
        });
      }
    }

    try {
      await authApi().post(`/availability/staff/${selectedStaff}`, { schedules });
      setMessage({ type: 'success', text: 'All schedules updated successfully!' });
      loadAvailability(selectedStaff);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update schedules',
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  const selectedStaffData = staff.find((s) => s.id === parseInt(selectedStaff));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Availability</h1>
        <Link href="/admin" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <label>
          <strong>Select Staff Member</strong>
          <select
            value={selectedStaff || ''}
            onChange={(e) => setSelectedStaff(parseInt(e.target.value))}
            style={{ marginTop: '0.5rem' }}
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.specialization && `- ${s.specialization}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message.text && (
        <div className={message.type === 'success' ? 'success' : 'error'} style={{ marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

      {selectedStaffData && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>{selectedStaffData.name}'s Availability</h2>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); setFormData({ dayOfWeek: '', startTime: '', endTime: '' }); }}>
            Add Schedule
          </button>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>{editing ? 'Edit Schedule' : 'Add New Schedule'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label>
                Day of Week *
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  required
                >
                  <option value="">Select day</option>
                  {DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>
                Start Time *
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>
                End Time *
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setFormData({ dayOfWeek: '', startTime: '', endTime: '' });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="list">
        {availability.length === 0 ? (
          <div className="card">
            <p>No availability schedules set for this staff member.</p>
          </div>
        ) : (
          availability.map((schedule) => {
            const dayLabel = DAYS.find((d) => d.value === schedule.dayOfWeek)?.label || 'Unknown';
            return (
              <div key={schedule.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{dayLabel}</h3>
                    <p>
                      <strong>Time:</strong> {schedule.startTime} - {schedule.endTime}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => handleEdit(schedule)}>
                      Edit
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleDelete(schedule.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
