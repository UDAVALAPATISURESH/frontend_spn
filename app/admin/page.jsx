'use client';

import { useEffect, useState } from 'react';
import { authApi } from '../../lib/api';
import Link from 'next/link';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi()
      .get('/admin/summary')
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error('Failed to load stats:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div className="admin-nav" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/admin/users" className="btn btn-primary">Manage Users</Link>
        <Link href="/admin/staff" className="btn btn-primary">Manage Staff</Link>
        <Link href="/admin/services" className="btn btn-primary">Manage Services</Link>
        <Link href="/admin/availability" className="btn btn-primary">Manage Availability</Link>
        <Link href="/admin/reviews" className="btn btn-primary">Manage Reviews</Link>
        <Link href="/admin/appointments" className="btn btn-primary">View Appointments</Link>
      </div>

      {stats && (
        <div className="grid-4">
          <div className="stat-card">
            <h3>Total Appointments</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalAppointments}</p>
          </div>
          <div className="stat-card">
            <h3>Today's Appointments</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.todayAppointments}</p>
          </div>
          <div className="stat-card">
            <h3>This Month</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.monthAppointments}</p>
          </div>
          <div className="stat-card">
            <h3>Monthly Revenue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>₹{stats.monthRevenue}</p>
          </div>
          <div className="stat-card">
            <h3>Total Customers</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Active Services</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalServices}</p>
          </div>
          <div className="stat-card">
            <h3>Active Staff</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalStaff}</p>
          </div>
          <div className="stat-card">
            <h3>Total Reviews</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalReviews}</p>
          </div>
        </div>
      )}
    </div>
  );
}
