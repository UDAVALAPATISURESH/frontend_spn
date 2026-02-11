'use client';

import { useEffect, useState } from 'react';

// Helper function to get auth state from localStorage synchronously
function getAuthState() {
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, role: null };
  }
  const token = window.localStorage.getItem('token');
  const storedRole = window.localStorage.getItem('role');
  return {
    isLoggedIn: !!token,
    role: storedRole,
  };
}

export default function Navbar() {
  const [authState, setAuthState] = useState({ isLoggedIn: false, role: null });

  useEffect(() => {
    // Set auth state from localStorage after mount
    setAuthState(getAuthState());

    // Listen for storage changes (e.g., login/logout from another tab)
    const handleStorageChange = () => {
      setAuthState(getAuthState());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const { isLoggedIn, role } = authState;

  const handleLogout = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('role');
    setAuthState({ isLoggedIn: false, role: null });
    window.location.href = '/';
  };

  return (
    <nav className="nav">
      {role !== 'staff' && role !== 'admin' && <a href="/">Home</a>}
      {role !== 'staff' && role !== 'admin' && <a href="/services">Services</a>}
      {(!isLoggedIn || role === 'customer') && <a href="/booking">Book</a>}
      {isLoggedIn && role === 'customer' && <a href="/dashboard">My Appointments</a>}
      {isLoggedIn && role === 'customer' && <a href="/profile">Profile</a>}
      {isLoggedIn && role === 'staff' && <a href="/staff/dashboard">My Schedule</a>}
      {isLoggedIn && role === 'admin' && <a href="/admin">Admin</a>}
      {!isLoggedIn && <a href="/login">Login</a>}
      {!isLoggedIn && <a href="/register">Register</a>}
      {isLoggedIn && (
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ marginLeft: '1rem' }}
        >
          Logout
        </button>
      )}
    </nav>
  );
}

