'use client';

import { useEffect, useState } from 'react';
import { authApi } from '../../../lib/api';
import Link from 'next/link';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = () => {
    authApi()
      .get('/admin/appointments')
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error('Failed to load appointments:', err))
      .finally(() => setLoading(false));
  };

  const handleConfirm = async (id) => {
    if (!confirm('Confirm this appointment?')) return;
    try {
      await authApi().put(`/admin/appointments/${id}/confirm`);
      setMessage({ type: 'success', text: 'Appointment confirmed successfully.' });
      loadAppointments();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to confirm appointment.',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleVerifyPayment = async (id) => {
    if (!confirm('Verify payment with payment gateway?')) return;
    try {
      await authApi().post(`/admin/appointments/${id}/verify-payment`);
      setMessage({ type: 'success', text: 'Payment verified successfully.' });
      loadAppointments();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to verify payment.',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleVerifyAndConfirm = async (id) => {
    if (!confirm('Verify payment and confirm appointment?')) return;
    try {
      await authApi().post(`/admin/appointments/${id}/verify-and-confirm`);
      setMessage({ type: 'success', text: 'Payment verified and appointment confirmed successfully.' });
      loadAppointments();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to verify payment and confirm appointment.',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>All Appointments</h1>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Showing latest appointments first
          </p>
        </div>
        <Link href="/admin" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      {message.text && (
        <div className={message.type === 'success' ? 'success' : 'error'} style={{ marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

      <div className="list">
        {appointments.map((apt) => {
          // Get services - use AppointmentServices if available, otherwise use PrimaryService
          const services = apt.AppointmentServices && apt.AppointmentServices.length > 0 
            ? apt.AppointmentServices 
            : (apt.PrimaryService ? [{ Service: apt.PrimaryService, Staff: apt.PrimaryStaff }] : []);
          
          // Get staff names from services
          const staffNames = services
            .map(svc => svc.Staff?.name || 'N/A')
            .filter((name, index, arr) => arr.indexOf(name) === index) // Remove duplicates
            .join(', ') || apt.PrimaryStaff?.name || 'N/A';
          
          // Calculate total price
          const totalPrice = services.reduce((sum, svc) => sum + (parseFloat(svc.Service?.price || 0)), 0);

          const isLatest = appointments.indexOf(apt) === 0;
          const appointmentDate = new Date(apt.startTime);
          const isRecent = (new Date() - appointmentDate) / (1000 * 60 * 60 * 24) <= 7;

          return (
          <div key={apt.id} className="card" style={{ 
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
              <div>
                <h3>
                  {services.length > 1 
                    ? `${services.length} Services` 
                    : (services[0]?.Service?.name || apt.PrimaryService?.name || 'N/A')}
                </h3>
                {services.length > 1 && (
                  <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid #e5e7eb' }}>
                    {services.map((svc, idx) => (
                      <p key={idx} style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                        • {svc.Service?.name || 'N/A'} - {svc.Staff?.name || 'N/A'} (₹{svc.Service?.price || 0})
                      </p>
                    ))}
                  </div>
                )}
                <p><strong>Customer:</strong> {apt.User?.name || 'N/A'} ({apt.User?.email || 'N/A'})</p>
                <p><strong>Staff:</strong> {staffNames}</p>
                <p><strong>Date & Time:</strong> {new Date(apt.startTime).toLocaleString()}</p>
                <p><strong>Duration:</strong> {Math.round((new Date(apt.endTime) - new Date(apt.startTime)) / 60000)} minutes</p>
                <p><strong>Status:</strong> <span style={{ 
                  color: apt.status === 'confirmed' ? 'green' : apt.status === 'cancelled' ? 'red' : 'orange',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}>{apt.status}</span></p>
                {apt.notes && <p><strong>Notes:</strong> {apt.notes}</p>}
                <p><strong>Total Price:</strong> ₹{totalPrice.toFixed(2)}</p>
                <p><strong>Payment Status:</strong> 
                  {apt.Payment ? (
                    <span style={{
                      color: apt.Payment.status === 'paid' ? 'green' : 'red',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      marginLeft: '0.5rem'
                    }}>
                      {apt.Payment.status} ({apt.Payment.provider || 'N/A'})
                    </span>
                  ) : (
                    <span style={{ color: 'red', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                      NOT PAID
                    </span>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                {apt.status === 'pending' && (
                  <>
                    {apt.Payment?.status === 'paid' ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleConfirm(apt.id)}
                      >
                        Confirm Appointment
                      </button>
                    ) : apt.Payment ? (
                      <>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleVerifyAndConfirm(apt.id)}
                          style={{ background: '#059669' }}
                        >
                          Verify & Confirm
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleVerifyPayment(apt.id)}
                          style={{ fontSize: '0.875rem' }}
                        >
                          Verify Payment Only
                        </button>
                        <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem' }}>
                          ⚠️ Payment status: {apt.Payment.status.toUpperCase()}
                        </p>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-secondary"
                          disabled
                          style={{ opacity: 0.6, cursor: 'not-allowed' }}
                          title="Payment must be completed before confirming appointment"
                        >
                          Confirm (Payment Required)
                        </button>
                        <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem' }}>
                          ⚠️ Customer must complete payment first
                        </p>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
