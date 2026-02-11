'use client';

import { useEffect, useState } from 'react';
import { authApi } from '../../../lib/api';
import Link from 'next/link';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = () => {
    authApi()
      .get('/reviews')
      .then((res) => setReviews(res.data))
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => setLoading(false));
  };

  const handleRespond = async (reviewId) => {
    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }
    try {
      await authApi().put(`/reviews/${reviewId}/response`, { staffResponse: responseText });
      setRespondingTo(null);
      setResponseText('');
      loadReviews();
    } catch (err) {
      alert('Error saving response: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await authApi().delete(`/reviews/${id}`);
      loadReviews();
    } catch (err) {
      alert('Error deleting review: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Reviews</h1>
        <Link href="/admin" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      <div className="list">
        {reviews.map((review) => (
          <div key={review.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3>{review.User?.name || 'Anonymous'}</h3>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: i < review.rating ? '#ffc107' : '#ccc' }}>★</span>
                    ))}
                  </div>
                </div>
                <p><strong>Service:</strong> {review.Service?.name || 'N/A'}</p>
                {review.Staff && <p><strong>Staff:</strong> {review.Staff.name}</p>}
                {review.comment && <p style={{ marginTop: '0.5rem' }}>{review.comment}</p>}
                {review.staffResponse && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                    <p><strong>Staff Response:</strong></p>
                    <p>{review.staffResponse}</p>
                  </div>
                )}
                <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {!review.staffResponse && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setRespondingTo(review.id);
                      setResponseText('');
                    }}
                  >
                    Respond
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => handleDelete(review.id)}>Delete</button>
              </div>
            </div>

            {respondingTo === review.id && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response..."
                  rows="3"
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" onClick={() => handleRespond(review.id)}>Submit Response</button>
                  <button className="btn btn-secondary" onClick={() => { setRespondingTo(null); setResponseText(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
