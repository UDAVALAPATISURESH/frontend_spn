'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from './api';

/**
 * Hook to check authentication and role
 * Redirects to login if not authenticated
 * Redirects to appropriate page if role doesn't match
 * @param {string|null} requiredRole - 'admin', 'staff', or null for any authenticated user
 */
export function useAuth(requiredRole = null) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      // Check if token exists in localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token) {
        // No token - redirect to login immediately
        router.push('/login');
        return;
      }

      // Verify token with backend
      try {
        const res = await authApi().get('/users/profile');
        const userData = res.data;
        setUser(userData);
        setIsAuthenticated(true);

        // Check if role matches requirement
        if (requiredRole && userData.role !== requiredRole) {
          // Wrong role - redirect based on actual role
          if (userData.role === 'admin') {
            router.push('/admin');
          } else if (userData.role === 'staff') {
            router.push('/staff/dashboard');
          } else {
            router.push('/dashboard');
          }
          return;
        }

        // Update localStorage role if it changed
        const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
        if (userData.role !== storedRole) {
          localStorage.setItem('role', userData.role);
        }
      } catch (err) {
        // Token invalid or expired
        if (err.response?.status === 401 || err.response?.status === 403) {
          // Clear invalid token
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
    } finally {
      setIsLoading(false);
    }
  };

  return { isAuthenticated, isLoading, user, checkAuth };
}

/**
 * Higher-order component to protect admin routes
 */
export function withAdminAuth(Component) {
  return function AdminProtectedComponent(props) {
    const { isAuthenticated, isLoading, user } = useAuth('admin');

    if (isLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Loading...</h2>
          <p>Checking authentication...</p>
        </div>
      );
    }

    if (!isAuthenticated || user?.role !== 'admin') {
      return null; // Will redirect to login
    }

    return <Component {...props} />;
  };
}
