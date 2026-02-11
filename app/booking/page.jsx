'use client';

import { useEffect, useState } from 'react';
import { api, authApi } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function BookingPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is staff or admin - redirect them
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('role');
      if (role === 'staff') {
        router.push('/staff/dashboard');
        return;
      }
      if (role === 'admin') {
        router.push('/admin');
        return;
      }
    }

    api.get('/services').then((res) => setServices(res.data));
    api.get('/staff').then((res) => setStaff(res.data));
  }, []);

  // Load available slots when service, staff, and date are selected
  useEffect(() => {
    if (form.serviceId && form.staffId && form.date) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [form.serviceId, form.staffId, form.date]);

  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    setError(''); // Clear previous errors
    try {
      const res = await api.get('/availability/available-slots', {
        params: {
          staffId: form.staffId,
          serviceId: form.serviceId,
          date: form.date,
        },
      });
      setAvailableSlots(res.data.slots || []);
      // Show message from backend if provided
      if (res.data.message && res.data.slots.length === 0) {
        setError(res.data.message);
      }
    } catch (err) {
      console.error('Failed to load available slots:', err);
      setAvailableSlots([]);
      setError(err.response?.data?.message || 'Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'time' && e.target.value) {
      setError(''); // Clear error when user selects a time
    }
  };

  const handleSlotSelect = (slotStartTime) => {
    const slotDate = new Date(slotStartTime);
    const timeString = slotDate.toTimeString().slice(0, 5); // HH:MM format
    setForm({ ...form, time: timeString });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Check if user is logged in
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const startTime = new Date(`${form.date}T${form.time}:00`);
      const res = await authApi().post('/appointments', {
        serviceId: Number(form.serviceId),
        staffId: Number(form.staffId),
        startTime: startTime.toISOString(),
        notes: form.notes,
      });

      setMessage('Appointment booked successfully! Redirecting to payment...');
      // Reset form and go to payment page for this appointment
      setTimeout(() => {
        setForm({ serviceId: '', staffId: '', date: '', time: '', notes: '' });
        setAvailableSlots([]);
        // Use window.location for reliable redirect
        window.location.href = `/payment?appointmentId=${res.data.id}`;
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    }
  };

  const selectedService = services.find((s) => s.id === parseInt(form.serviceId));
  const selectedStaff = staff.find((s) => s.id === parseInt(form.staffId));
  const minDate = new Date().toISOString().split('T')[0]; // Today's date

  return (
    <div>
      <h1>Book an Appointment</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="form">
          <div className="grid-2">
            <label>
              Service *
              <select name="serviceId" value={form.serviceId} onChange={handleChange} required>
                <option value="">Select service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} min) - ₹{s.price}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Staff Member *
              <select name="staffId" value={form.staffId} onChange={handleChange} required>
                <option value="">Select staff</option>
                {staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.specialization && `- ${st.specialization}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedService && selectedStaff && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
              <p><strong>Selected:</strong> {selectedService.name} with {selectedStaff.name}</p>
              <p><strong>Duration:</strong> {selectedService.durationMinutes} minutes</p>
              <p><strong>Price:</strong> ₹{selectedService.price}</p>
            </div>
          )}

          <div className="grid-2" style={{ marginTop: '1rem' }}>
            <label>
              Date *
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                min={minDate}
                required
              />
            </label>

            <label>
              Time *
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          {form.serviceId && form.staffId && form.date && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3>Available Time Slots</h3>
              {loadingSlots ? (
                <p>Loading available slots...</p>
              ) : availableSlots.length === 0 ? (
                <div>
                  <p style={{ color: '#ef4444', marginBottom: '0.5rem' }}>
                    {error || 'No available slots for this date. Please select a different date or staff member.'}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#666' }}>
                    💡 Tip: Make sure staff availability is set for this day. Admin can set availability in Admin → Staff → Manage Availability.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {availableSlots.map((slot, index) => {
                    const slotDate = new Date(slot.startTime);
                    const timeString = slotDate.toTimeString().slice(0, 5);
                    const isSelected = form.time === timeString;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSlotSelect(slot.startTime)}
                        className={isSelected ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        {slot.displayTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <label className="full-width" style={{ marginTop: '1rem' }}>
            Notes (Optional)
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any special requests or notes..."
            />
          </label>

          {message && <p className="success full-width">{message}</p>}
          {error && <p className="error full-width">{error}</p>}

          <div className="full-width" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={!form.serviceId || !form.staffId || !form.date || !form.time}>
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
