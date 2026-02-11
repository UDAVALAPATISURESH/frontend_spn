'use client';

import { useEffect, useState } from 'react';
import { authApi } from '../../../lib/api';
import { useRouter } from 'next/navigation';

export default function StaffDashboardPage() {
  const router = useRouter();
  const [staff, setStaff] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await authApi().get('/appointments/staff/my');
      setStaff(res.data.staff);
      setAppointments(res.data.appointments);
    } catch (err) {
      if (err.response?.status === 404) {
        setMessage({
          type: 'error',
          text: err.response.data.message || 'Staff profile not found. Please contact admin.',
        });
      } else {
        console.error('Failed to load appointments:', err);
        setMessage({ type: 'error', text: 'Failed to load appointments' });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

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
    return appointments.filter((apt) => apt.status === status);
  };

  const getTodayAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate >= today && aptDate < tomorrow && apt.status !== 'cancelled';
    });
  };

  const [filter, setFilter] = useState('all');
  const filteredAppointments = filterAppointments(filter);
  const todayAppointments = getTodayAppointments();
  const [respondingTo, setRespondingTo] = useState(null); // reviewId being responded to
  const [responseText, setResponseText] = useState('');

  const handleCompleteService = async (appointmentId, serviceId) => {
    if (!confirm('Mark this service as completed?')) return;

    try {
      await authApi().put(`/appointments/${appointmentId}/complete-service/${serviceId}`);
      setMessage({ type: 'success', text: 'Service marked as completed' });
      loadAppointments(); // Reload appointments
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to complete service',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleComplete = async (appointmentId) => {
    if (!confirm('Mark this appointment as completed?')) return;

    try {
      await authApi().put(`/appointments/${appointmentId}/complete`);
      setMessage({ type: 'success', text: 'Appointment marked as completed' });
      loadAppointments(); // Reload appointments
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to complete appointment',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleRespondToReview = async (reviewId) => {
    if (!responseText.trim()) {
      setMessage({ type: 'error', text: 'Please enter a response' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    try {
      await authApi().put(`/reviews/${reviewId}/response`, { staffResponse: responseText });
      setMessage({ type: 'success', text: 'Response submitted successfully' });
      setRespondingTo(null);
      setResponseText('');
      loadAppointments();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit response',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

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
        <h1>Staff Dashboard</h1>
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
        {staff && (
          <div>
            <h2>Welcome, {staff.name}!</h2>
            {staff.specialization && <p>Specialization: {staff.specialization}</p>}
          </div>
        )}
      </div>

      {/* Today's Appointments - Prominent Section */}
      {todayAppointments.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--color-gray-900)', background: 'var(--color-gray-50)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: 'var(--color-gray-900)', margin: 0 }}>📅 Today's Appointments ({todayAppointments.length})</h2>
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Latest First</span>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {todayAppointments.map((appointment) => {
              // Show individual services if available, otherwise show single service (backward compatibility)
              const services = appointment.AppointmentServices || [];
              const hasMultipleServices = services.length > 0;

              return (
                <div key={appointment.id} className="card" style={{ padding: '1.5rem', background: '#ffffff' }}>
                  <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: 0 }}>Appointment #{appointment.id}</h3>
                        <p className={getStatusColor(appointment.status)} style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                          Status: {appointment.status.toUpperCase()}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          {formatDate(appointment.startTime)}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      <div><strong>Customer:</strong> {appointment.User?.name || 'N/A'}</div>
                      <div><strong>Email:</strong> {appointment.User?.email || 'N/A'}</div>
                      {appointment.User?.phone && (
                        <div><strong>Phone:</strong> <a href={`tel:${appointment.User.phone}`}>{appointment.User.phone}</a></div>
                      )}
                    </div>
                    {appointment.notes && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}
                  </div>

                  {/* Services List */}
                  {hasMultipleServices ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {services.map((aptService) => (
                        <div key={aptService.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                            <div>
                              <h4 style={{ margin: 0 }}>{aptService.Service?.name || 'Service'}</h4>
                              <p style={{ marginTop: '0.25rem', marginBottom: 0, fontSize: '0.875rem', color: '#666' }}>
                                {formatTime(aptService.startTime)} - {formatTime(aptService.endTime)}
                              </p>
                            </div>
                            <div>
                              <span className={getStatusColor(aptService.status)} style={{ fontSize: '0.875rem' }}>
                                {aptService.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gap: '0.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', fontSize: '0.875rem' }}>
                            <div><strong>Duration:</strong> {aptService.Service?.durationMinutes || 0} min</div>
                            <div><strong>Price:</strong> ₹{aptService.Service?.price || 0}</div>
                          </div>
                          {aptService.status !== 'completed' && appointment.status !== 'cancelled' && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <button
                                onClick={() => handleCompleteService(appointment.id, aptService.serviceId)}
                                className="btn btn-primary"
                                style={{ background: '#166534', fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                              >
                                ✓ Complete Service
                              </button>
                            </div>
                          )}
                          {aptService.status === 'completed' && aptService.Review && (
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Customer Review:</div>
                              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} style={{ color: i < aptService.Review.rating ? '#ffc107' : '#ccc' }}>★</span>
                                ))}
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>{aptService.Review.rating}/5</span>
                              </div>
                              {aptService.Review.comment && (
                                <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>{aptService.Review.comment}</p>
                              )}
                              {aptService.Review.staffResponse ? (
                                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#ffffff', borderRadius: '4px' }}>
                                  <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Your Response:</p>
                                  <p style={{ fontSize: '0.875rem', margin: 0 }}>{aptService.Review.staffResponse}</p>
                                </div>
                              ) : (
                                <>
                                  {respondingTo === aptService.Review.id ? (
                                    <div style={{ marginTop: '0.75rem' }}>
                                      <textarea
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        placeholder="Enter your response to this review..."
                                        rows="3"
                                        style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', marginBottom: '0.5rem' }}
                                      />
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                          onClick={() => handleRespondToReview(aptService.Review.id)}
                                          className="btn btn-primary"
                                          style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                                        >
                                          Submit Response
                                        </button>
                                        <button
                                          onClick={() => {
                                            setRespondingTo(null);
                                            setResponseText('');
                                          }}
                                          className="btn btn-secondary"
                                          style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setRespondingTo(aptService.Review.id);
                                        setResponseText('');
                                      }}
                                      className="btn btn-primary"
                                      style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem', marginTop: '0.5rem' }}
                                    >
                                      Respond to Review
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Backward compatibility: single service
                    <div>
                      <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                        <h4 style={{ margin: 0 }}>{appointment.Service?.name || 'Service'}</h4>
                        <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', fontSize: '0.875rem' }}>
                          <div><strong>Duration:</strong> {appointment.Service?.durationMinutes || 0} min</div>
                          <div><strong>Price:</strong> ₹{appointment.Service?.price || 0}</div>
                        </div>
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <button
                              onClick={() => handleComplete(appointment.id)}
                              className="btn btn-primary"
                              style={{ background: '#166534' }}
                            >
                              ✓ Mark as Completed
                            </button>
                          </div>
                        )}
                      </div>
                      {appointment.status === 'completed' && appointment.Review && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                          <h4 style={{ marginBottom: '0.5rem' }}>Customer Review</h4>
                          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                            {[...Array(5)].map((_, i) => (
                              <span key={i} style={{ color: i < appointment.Review.rating ? '#ffc107' : '#ccc', fontSize: '1.2rem' }}>★</span>
                            ))}
                            <span style={{ marginLeft: '0.5rem', fontWeight: '600' }}>{appointment.Review.rating}/5</span>
                          </div>
                          {appointment.Review.comment && <p style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>{appointment.Review.comment}</p>}
                          {appointment.Review.staffResponse ? (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#ffffff', borderRadius: '4px' }}>
                              <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Your Response:</p>
                              <p style={{ margin: 0 }}>{appointment.Review.staffResponse}</p>
                            </div>
                          ) : (
                            <>
                              {respondingTo === appointment.Review.id ? (
                                <div style={{ marginTop: '1rem' }}>
                                  <textarea
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Enter your response to this review..."
                                    rows="3"
                                    style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                  />
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={() => handleRespondToReview(appointment.Review.id)}
                                      className="btn btn-primary"
                                    >
                                      Submit Response
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRespondingTo(null);
                                        setResponseText('');
                                      }}
                                      className="btn btn-secondary"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setRespondingTo(appointment.Review.id);
                                    setResponseText('');
                                  }}
                                  className="btn btn-primary"
                                  style={{ marginTop: '0.5rem' }}
                                >
                                  Respond to Review
                                </button>
                              )}
                            </>
                          )}
                          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                            Reviewed on {new Date(appointment.Review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {message.text && (
        <div className={`card ${message.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>All Appointments</h2>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Showing latest first
          </span>
        </div>

        {/* Filter buttons */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            All ({appointments.length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={filter === 'confirmed' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Confirmed ({appointments.filter((a) => a.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={filter === 'pending' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Pending ({appointments.filter((a) => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={filter === 'completed' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Completed ({appointments.filter((a) => a.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={filter === 'cancelled' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Cancelled ({appointments.filter((a) => a.status === 'cancelled').length})
          </button>
        </div>

        {filteredAppointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredAppointments.map((appointment, index) => {
              const isLatest = index === 0 && filter === 'all';
              const appointmentDate = new Date(appointment.startTime);
              const isRecent = (new Date() - appointmentDate) / (1000 * 60 * 60 * 24) <= 7;
              
              return (
              <div key={appointment.id} className="card" style={{ 
                padding: '1.5rem',
                borderLeft: isLatest ? '4px solid var(--color-primary-600)' : '1px solid var(--color-border)',
                position: 'relative'
              }}>
                {isLatest && (
                  <span className="badge badge-info" style={{ 
                    position: 'absolute', 
                    top: '1rem', 
                    right: '1rem',
                    fontSize: '0.75rem'
                  }}>
                    Latest
                  </span>
                )}
                {isRecent && !isLatest && (
                  <span className="badge badge-success" style={{ 
                    position: 'absolute', 
                    top: '1rem', 
                    right: '1rem',
                    fontSize: '0.75rem'
                  }}>
                    Recent
                  </span>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3>{appointment.Service?.name || 'Service'}</h3>
                    <p className={getStatusColor(appointment.status)} style={{ marginTop: '0.5rem' }}>
                      Status: {appointment.status.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <strong>Customer:</strong> {appointment.User?.name || 'N/A'}
                  </div>
                  <div>
                    <strong>Email:</strong> {appointment.User?.email || 'N/A'}
                  </div>
                  {appointment.User?.phone && (
                    <div>
                      <strong>Phone:</strong> {appointment.User.phone}
                    </div>
                  )}
                  <div>
                    <strong>Date:</strong> {formatDate(appointment.startTime)}
                  </div>
                  <div>
                    <strong>Time:</strong> {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </div>
                  <div>
                    <strong>Duration:</strong> {appointment.Service?.durationMinutes || 0} minutes
                  </div>
                  <div>
                    <strong>Price:</strong> ₹{appointment.Service?.price || 0}
                  </div>
                  {appointment.notes && (
                    <div>
                      <strong>Notes:</strong> {appointment.notes}
                    </div>
                  )}
                </div>
                {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleComplete(appointment.id)}
                      className="btn btn-primary"
                      style={{ background: '#166534' }}
                    >
                      ✓ Mark as Completed
                    </button>
                  </div>
                )}

                {/* Review Display for Completed Appointments - Backward compatibility */}
                {appointment.status === 'completed' && appointment.Review && !appointment.AppointmentServices && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>Customer Review</h4>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ color: i < appointment.Review.rating ? '#ffc107' : '#ccc', fontSize: '1.2rem' }}>
                          ★
                        </span>
                      ))}
                      <span style={{ marginLeft: '0.5rem', fontWeight: '600' }}>
                        {appointment.Review.rating}/5
                      </span>
                    </div>
                    {appointment.Review.comment && (
                      <p style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>{appointment.Review.comment}</p>
                    )}
                    {appointment.Review.staffResponse ? (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#ffffff', borderRadius: '4px' }}>
                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Your Response:</p>
                        <p style={{ margin: 0 }}>{appointment.Review.staffResponse}</p>
                      </div>
                    ) : (
                      <>
                        {respondingTo === appointment.Review.id ? (
                          <div style={{ marginTop: '1rem' }}>
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Enter your response to this review..."
                              rows="3"
                              style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleRespondToReview(appointment.Review.id)}
                                className="btn btn-primary"
                              >
                                Submit Response
                              </button>
                              <button
                                onClick={() => {
                                  setRespondingTo(null);
                                  setResponseText('');
                                }}
                                className="btn btn-secondary"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setRespondingTo(appointment.Review.id);
                              setResponseText('');
                            }}
                            className="btn btn-primary"
                            style={{ marginTop: '0.5rem' }}
                          >
                            Respond to Review
                          </button>
                        )}
                      </>
                    )}
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      Reviewed on {new Date(appointment.Review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
