'use client';

import { useEffect, useState } from 'react';
import { authApi } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reviewing, setReviewing] = useState(null); // appointmentId being reviewed
  const [reviewingService, setReviewingService] = useState(null); // serviceId being reviewed
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await authApi().get('/appointments/my');
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const canRescheduleOrCancel = (appointment) => {
    const appointmentTime = new Date(appointment.startTime);
    const now = new Date();
    const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
    return hoursUntilAppointment >= 24 && appointment.status === 'confirmed';
  };

  const handleReschedule = async (appointmentId) => {
    if (!rescheduleForm.date || !rescheduleForm.time) {
      setMessage({ type: 'error', text: 'Please select both date and time' });
      return;
    }

    try {
      const startTime = new Date(`${rescheduleForm.date}T${rescheduleForm.time}:00`);
      await authApi().put(`/appointments/${appointmentId}/reschedule`, {
        startTime: startTime.toISOString(),
      });
      setMessage({ type: 'success', text: 'Appointment rescheduled successfully!' });
      setRescheduling(null);
      setRescheduleForm({ date: '', time: '' });
      loadAppointments();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reschedule appointment',
      });
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await authApi().delete(`/appointments/${appointmentId}`);
      setMessage({ type: 'success', text: 'Appointment cancelled successfully!' });
      loadAppointments();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to cancel appointment',
      });
    }
  };

  const handleSubmitReview = async (appointment, serviceId, staffId) => {
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      setMessage({ type: 'error', text: 'Please select a rating (1-5 stars)' });
      return;
    }

    if (!serviceId) {
      setMessage({ type: 'error', text: 'Please select a service to review' });
      return;
    }

    try {
      await authApi().post('/reviews', {
        appointmentId: appointment.id,
        serviceId: serviceId,
        staffId: staffId || null,
        rating: reviewForm.rating,
        comment: reviewForm.comment || null,
      });
      setMessage({ type: 'success', text: 'Review submitted successfully!' });
      setReviewing(null);
      setReviewingService(null);
      setReviewForm({ rating: 5, comment: '' });
      loadAppointments();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit review',
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  // Check if appointment is recent (within last 7 days)
  const isRecentAppointment = (appointment) => {
    const appointmentDate = new Date(appointment.startTime);
    const now = new Date();
    const daysDiff = (now - appointmentDate) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7 && daysDiff >= 0;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>My Appointments</h1>
        {appointments.length > 0 && (
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Showing latest first
          </span>
        )}
      </div>

      {message.text && (
        <div className={message.type === 'success' ? 'success' : 'error'} style={{ marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

      {appointments.length === 0 && <p>No appointments yet.</p>}

      <div className="list">
        {appointments.map((a, index) => {
          const appointmentDate = new Date(a.startTime);
          const appointmentEnd = new Date(a.endTime);
          const canModify = canRescheduleOrCancel(a);
          const isPast = new Date(a.startTime) < new Date();
          const isRecent = isRecentAppointment(a);
          const isLatest = index === 0;

          return (
            <div key={a.id} className="card" style={{ 
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3>{a.Service?.name || 'Service'}</h3>
                  <p><strong>Staff:</strong> {a.Staff?.name || 'Staff'}</p>
                  <p>
                    <strong>Date:</strong>{' '}
                    {appointmentDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p>
                    <strong>Time:</strong>{' '}
                    {appointmentDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}{' '}
                    -{' '}
                    {appointmentEnd.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span
                      style={{
                        color:
                          a.status === 'confirmed'
                            ? 'green'
                            : a.status === 'cancelled'
                            ? 'red'
                            : a.status === 'completed'
                            ? 'blue'
                            : 'orange',
                        fontWeight: 'bold',
                      }}
                    >
                      {a.status.toUpperCase()}
                    </span>
                  </p>
                  {a.notes && <p><strong>Notes:</strong> {a.notes}</p>}
                  {a.Service?.price && <p><strong>Price:</strong> ₹{a.Service.price}</p>}
                  {!canModify && !isPast && a.status === 'confirmed' && (
                    <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                      Cannot reschedule or cancel within 24 hours of appointment
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                  {canModify && (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setRescheduling(a.id);
                          const dateStr = appointmentDate.toISOString().split('T')[0];
                          const timeStr = appointmentDate.toTimeString().slice(0, 5);
                          setRescheduleForm({ date: dateStr, time: timeStr });
                        }}
                      >
                        Reschedule
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleCancel(a.id)}>
                        Cancel
                      </button>
                    </>
                  )}
                  {isPast && a.status === 'confirmed' && (
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>Past appointment</span>
                  )}
                  {a.status === 'completed' && 
                   !(a.AppointmentServices && a.AppointmentServices.some(s => s.Review)) && 
                   !a.Review && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setReviewing(a.id);
                        // If multiple services, don't set a specific one yet (user will select)
                        // If single service, set it immediately
                        if (a.AppointmentServices && a.AppointmentServices.length > 0) {
                          setReviewingService(a.AppointmentServices[0].serviceId);
                        } else {
                          setReviewingService(a.serviceId);
                        }
                      }}
                      style={{ background: '#166534' }}
                    >
                      Leave Review
                    </button>
                  )}
                </div>
              </div>

              {/* Services List - Show all services if multiple */}
              {a.AppointmentServices && a.AppointmentServices.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Services in this Appointment:</h4>
                  {a.AppointmentServices.map((aptSvc, idx) => {
                    const serviceReview = a.AppointmentServices?.find(s => s.Review)?.Review || null;
                    const hasReview = aptSvc.Review;
                    return (
                      <div key={idx} style={{ marginTop: idx > 0 ? '0.75rem' : 0, padding: '0.75rem', background: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <p style={{ fontWeight: '600', margin: 0 }}>{aptSvc.Service?.name || 'Service'}</p>
                            <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.25rem 0 0 0' }}>
                              Staff: {aptSvc.Staff?.name || 'N/A'} | Status: {aptSvc.status}
                            </p>
                          </div>
                          {a.status === 'completed' && !hasReview && (
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                setReviewing(a.id);
                                setReviewingService(aptSvc.serviceId);
                              }}
                              style={{ background: '#166534', fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                            >
                              Review This Service
                            </button>
                          )}
                        </div>
                        {hasReview && (
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                            <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Your Review:</p>
                            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem', alignItems: 'center' }}>
                              {[...Array(5)].map((_, i) => (
                                <span key={i} style={{ color: i < aptSvc.Review.rating ? '#ffc107' : '#ccc' }}>★</span>
                              ))}
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                {aptSvc.Review.rating}/5
                              </span>
                            </div>
                            {aptSvc.Review.comment && (
                              <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>{aptSvc.Review.comment}</p>
                            )}
                            {aptSvc.Review.staffResponse && (
                              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem', color: '#059669' }}>
                                  💬 Staff Response{aptSvc.Review.Staff ? ` from ${aptSvc.Review.Staff.name}` : (aptSvc.Staff ? ` from ${aptSvc.Staff.name}` : '')}:
                                </p>
                                <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>{aptSvc.Review.staffResponse}</p>
                              </div>
                            )}
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                              Reviewed on {new Date(aptSvc.Review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Review Display - Backward compatibility for single service */}
              {a.status === 'completed' && a.Review && !a.AppointmentServices && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Your Review</h4>
                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: i < a.Review.rating ? '#ffc107' : '#ccc', fontSize: '1.2rem' }}>
                        ★
                      </span>
                    ))}
                  </div>
                  {a.Review.comment && <p style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>{a.Review.comment}</p>}
                  {a.Review.staffResponse && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                      <p style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#059669' }}>
                        💬 Staff Response{a.Review.Staff ? ` from ${a.Review.Staff.name}` : ''}:
                      </p>
                      <p style={{ margin: 0, color: '#374151' }}>{a.Review.staffResponse}</p>
                    </div>
                  )}
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    Reviewed on {new Date(a.Review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Review Form */}
              {reviewing === a.id && a.status === 'completed' && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4>Leave a Review</h4>
                  {reviewingService && (
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                      Reviewing: {a.AppointmentServices?.find(s => s.serviceId === reviewingService)?.Service?.name || 'Service'}
                    </p>
                  )}
                  <div style={{ marginTop: '0.5rem' }}>
                    <label>
                      Rating (1-5 stars) *
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating })}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '1.5rem',
                              color: rating <= reviewForm.rating ? '#ffc107' : '#ccc',
                              padding: 0,
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </label>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <label>
                      Comment (optional)
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        placeholder="Share your experience..."
                        rows="3"
                        style={{ width: '100%', marginTop: '0.25rem' }}
                      />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        // Get service and staff info
                        let serviceId = reviewingService;
                        let staffId = null;
                        
                        if (a.AppointmentServices && a.AppointmentServices.length > 0) {
                          const selectedService = a.AppointmentServices.find(s => s.serviceId === reviewingService);
                          if (selectedService) {
                            serviceId = selectedService.serviceId;
                            staffId = selectedService.staffId;
                          } else {
                            // Fallback to first service
                            serviceId = a.AppointmentServices[0].serviceId;
                            staffId = a.AppointmentServices[0].staffId;
                          }
                        } else {
                          // Backward compatibility: single service
                          serviceId = a.serviceId;
                          staffId = a.staffId;
                        }
                        
                        handleSubmitReview(a, serviceId, staffId);
                      }}
                    >
                      Submit Review
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setReviewing(null);
                        setReviewingService(null);
                        setReviewForm({ rating: 5, comment: '' });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {rescheduling === a.id && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4>Reschedule Appointment</h4>
                  <div className="grid-2" style={{ marginTop: '0.5rem' }}>
                    <label>
                      New Date
                      <input
                        type="date"
                        value={rescheduleForm.date}
                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </label>
                    <label>
                      New Time
                      <input
                        type="time"
                        value={rescheduleForm.time}
                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                      />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => handleReschedule(a.id)}>
                      Confirm Reschedule
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setRescheduling(null);
                        setRescheduleForm({ date: '', time: '' });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
