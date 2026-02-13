'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../lib/api';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication first
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if token exists
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

      if (!token) {
        router.push('/login');
        return;
      }

      // Verify token and role with backend
      try {
        const profileRes = await authApi().get('/users/profile');
        const userData = profileRes.data;

        if (userData.role !== 'admin') {
          // Not admin - redirect to appropriate page
          if (userData.role === 'staff') {
            router.push('/staff/dashboard');
          } else {
            router.push('/dashboard');
          }
          return;
        }

        // User is admin - proceed to load stats
        setAuthChecked(true);
        loadStats();
      } catch (err) {
        // Token invalid or expired
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          router.push('/login');
        } else {
          console.error('Auth check error:', err);
          router.push('/login');
        }
      }
    } catch (err) {
      console.error('Auth check error:', err);
      router.push('/login');
    }
  };

  const loadStats = async () => {
    try {
      const res = await authApi().get('/admin/summary');
      setStats(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Unauthorized or forbidden - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        router.push('/login');
      } else {
        console.error('Failed to load stats:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Loading...</h2>
        <p>Checking authentication...</p>
      </div>
    );
  }

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
