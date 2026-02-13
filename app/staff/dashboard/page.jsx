'use client';

import { useEffect, useState } from 'react';
import { authApi } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';

export default function StaffDashboardPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth('staff');

  // ✅ ALL HOOKS MUST BE AT TOP
  const [staff, setStaff] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [filter, setFilter] = useState('all');
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  // ✅ effects after hooks
  useEffect(() => {
    if (!authLoading) {
      loadAppointments();
    }
  }, [authLoading]);

  // ✅ functions
  const loadAppointments = async () => {
    try {
      const res = await authApi().get('/appointments/staff/my');
      setStaff(res.data.staff);
      setAppointments(res.data.appointments);
    } catch (err) {
      if (err.response?.status === 404) {
        setMessage({
          type: 'error',
          text: err.response.data.message || 'Staff profile not found.',
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to load appointments' });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const filterAppointments = (status) => {
    if (status === 'all') return appointments;
    return appointments.filter((a) => a.status === status);
  };

  const getTodayAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return appointments.filter((apt) => {
      const d = new Date(apt.startTime);
      d.setHours(0, 0, 0, 0);
      return d >= today && d < tomorrow && apt.status !== 'cancelled';
    });
  };

  const handleComplete = async (appointmentId) => {
    if (!confirm('Mark this appointment as completed?')) return;

    try {
      await authApi().put(`/appointments/${appointmentId}/complete`);
      setMessage({ type: 'success', text: 'Appointment marked as completed' });
      loadAppointments();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to complete appointment',
      });
    }
  };

  const handleRespondToReview = async (reviewId) => {
    if (!responseText.trim()) {
      setMessage({ type: 'error', text: 'Please enter a response' });
      return;
    }

    try {
      await authApi().put(`/reviews/${reviewId}/response`, {
        staffResponse: responseText,
      });
      setMessage({ type: 'success', text: 'Response submitted successfully' });
      setRespondingTo(null);
      setResponseText('');
      loadAppointments();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit response',
      });
    }
  };

  // ✅ derived values AFTER functions
  const filteredAppointments = filterAppointments(filter);
  const todayAppointments = getTodayAppointments();

  // ================= RETURNS =================

  if (authLoading) {
    return (
      <div className="card">
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <p>Loading...</p>
      </div>
    );
  }

  if (message.type === 'error') {
    return (
      <div className="card">
        <p className="error">{message.text}</p>
        <button onClick={() => router.push('/')} className="btn btn-secondary">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1>Staff Dashboard</h1>
        {staff && <h2>Welcome, {staff.name}!</h2>}
      </div>

      {/* TODAY */}
      {todayAppointments.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>Today's Appointments ({todayAppointments.length})</h2>
        </div>
      )}

      {message.text && (
        <div className={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </div>
      )}

      {/* FILTER */}
      <div className="card">
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={filter === s ? 'btn btn-primary' : 'btn btn-secondary'}
              >
                {s}
              </button>
            )
          )}
        </div>

        {filteredAppointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="card">
              <h3>{appointment.Service?.name}</h3>
              <p className={getStatusColor(appointment.status)}>
                {appointment.status}
              </p>

              <p>
                {formatDate(appointment.startTime)} |{' '}
                {formatTime(appointment.startTime)} -{' '}
                {formatTime(appointment.endTime)}
              </p>

              {appointment.status !== 'completed' &&
                appointment.status !== 'cancelled' && (
                  <button
                    onClick={() => handleComplete(appointment.id)}
                    className="btn btn-primary"
                  >
                    ✓ Mark as Completed
                  </button>
                )}

              {appointment.Review && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Rating:</strong> {appointment.Review.rating}/5

                  {appointment.Review.staffResponse ? (
                    <p>Response: {appointment.Review.staffResponse}</p>
                  ) : (
                    <>
                      {respondingTo === appointment.Review.id ? (
                        <>
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                          />
                          <button
                            onClick={() =>
                              handleRespondToReview(appointment.Review.id)
                            }
                            className="btn btn-primary"
                          >
                            Submit
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setRespondingTo(appointment.Review.id);
                            setResponseText('');
                          }}
                          className="btn btn-secondary"
                        >
                          Respond
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
