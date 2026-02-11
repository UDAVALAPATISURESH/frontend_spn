'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

export default function HomePage() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    // Redirect admin to admin page if logged in
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('role');
      if (role === 'admin') {
        router.push('/admin');
      }
    }

    // Load reviews
    loadReviews();
  }, [router]);

  const loadReviews = async () => {
    try {
      const res = await api.get('/reviews');
      // Prioritize reviews with staff responses, then get top 6 most recent
      const reviewsWithResponses = res.data.filter(r => r.staffResponse);
      const reviewsWithoutResponses = res.data.filter(r => !r.staffResponse);
      // Show reviews with responses first, then others
      const sortedReviews = [...reviewsWithResponses, ...reviewsWithoutResponses].slice(0, 6);
      setReviews(sortedReviews);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  return (
    <div>
      <div className="hero">
        <div>
          <h1 className="hero-title">Book your next salon appointment in minutes</h1>
          <p className="hero-subtitle">
            Browse services, choose your favourite stylist, and pick a time that works for you.
          </p>
          <div className="hero-actions">
            <a href="/booking" className="btn btn-primary">
              Book an appointment
            </a>
            <a href="/services" className="btn btn-secondary">
              View services
            </a>
          </div>
        </div>
        <div className="hero-card">
          <h2>Today&apos;s highlights</h2>
          <ul>
            <li>Quick booking with live availability</li>
            <li>Secure online payments</li>
            <li>Automated reminders</li>
          </ul>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ marginTop: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>What Our Customers Say</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
            Read reviews from our satisfied customers and see how our staff responds
          </p>
        </div>

        {loadingReviews ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>No reviews yet. Be the first to leave a review!</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            {reviews.map((review) => (
              <div key={review.id} className="card" style={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--color-primary-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.25rem'
                    }}>
                      {review.User?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{review.User?.name || 'Anonymous'}</h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {review.Service?.name || 'Service'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          color: i < review.rating ? '#ffc107' : '#e5e7eb',
                          fontSize: '1.25rem'
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {review.comment && (
                  <p style={{ 
                    flex: 1,
                    margin: 0,
                    color: 'var(--color-text-primary)',
                    lineHeight: '1.6',
                    fontStyle: 'italic'
                  }}>
                    &quot;{review.comment}&quot;
                  </p>
                )}

                {review.Staff && (
                  <p style={{ 
                    marginTop: '0.75rem',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)'
                  }}>
                    Staff: {review.Staff.name}
                  </p>
                )}

                {review.staffResponse && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, var(--color-success-50) 0%, var(--color-info-50) 100%)',
                    borderRadius: '0.5rem',
                    border: '2px solid var(--color-success-300)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--color-success-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }}>
                        {review.Staff?.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div>
                        <p style={{ 
                          margin: 0,
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          color: 'var(--color-success-800)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          💬 {review.Staff?.name || 'Staff'} Response
                        </p>
                        <p style={{ 
                          margin: 0,
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)'
                        }}>
                          Official response from our team
                        </p>
                      </div>
                    </div>
                    <p style={{ 
                      margin: 0,
                      fontSize: '0.9rem',
                      color: 'var(--color-text-primary)',
                      lineHeight: '1.6',
                      paddingLeft: '2.5rem'
                    }}>
                      {review.staffResponse}
                    </p>
                  </div>
                )}

                <p style={{ 
                  marginTop: '1rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '0.75rem'
                }}>
                  {new Date(review.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

