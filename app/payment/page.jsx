'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();

  const [appointmentId, setAppointmentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [provider, setProvider] = useState('cashfree');

  /**
   * Read appointment id
   */
  useEffect(() => {
    if (!authLoading) {
      const id = searchParams.get('appointmentId');
      if (!id) {
        setError('Missing appointment ID. Please book an appointment first.');
        setAppointmentId(null);
      } else {
        setAppointmentId(id);
      }
    }
  }, [searchParams, authLoading]);

  /**
   * Load payment intent
   */
  useEffect(() => {
    if (!authLoading && appointmentId && provider) {
      loadPaymentIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, appointmentId, provider]);

  /**
   * API call
   */
  const loadPaymentIntent = async () => {
    if (!appointmentId) return;

    setLoading(true);
    setError('');

    try {
      const res = await authApi().post('/payments/create-intent', {
        appointmentId: Number(appointmentId),
        provider,
      });
      setPaymentData(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to initialize payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Stripe
   */
  const handleStripePayment = async () => {
    if (!paymentData?.clientSecret) {
      setError('Payment not initialized. Please refresh.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key'
      );

      if (!stripe) throw new Error('Stripe failed to load');

      const { error: stripeError } = await stripe.confirmPayment({
        clientSecret: paymentData.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?appointmentId=${appointmentId}`,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
      setLoading(false);
    }
  };

  /**
   * Cashfree
   */
  const handleCashfreePayment = async () => {
    if (!paymentData?.paymentSessionId) {
      setError('Payment not initialized.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';

      script.onload = () => {
        const cashfree = new window.Cashfree({
          mode: paymentData.testMode ? 'sandbox' : 'production',
        });

        cashfree.checkout({
          paymentSessionId: paymentData.paymentSessionId,
          redirectTarget: '_self',
        });
      };

      script.onerror = () => {
        setError('Failed to load Cashfree checkout');
        setLoading(false);
      };

      document.body.appendChild(script);
    } catch (err) {
      setError(err.message || 'Payment failed');
      setLoading(false);
    }
  };

  /**
   * Mock
   */
  const handleMockPayment = async () => {
    if (!appointmentId) return;

    setLoading(true);
    setError('');

    try {
      await authApi().post('/payments', {
        appointmentId: Number(appointmentId),
        provider: 'stripe',
      });

      setSuccess(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  const amount = paymentData?.amount || null;
  const hasStripeConfig = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const hasCashfreeConfig = paymentData?.appId;

  /**
   * ONE RETURN ONLY
   */
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {authLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Loading...</h2>
          <p>Checking authentication...</p>
        </div>
      ) : !appointmentId ? (
        <>
          <h1>Complete Your Payment</h1>
          <p className="error">
            Missing appointment. Go back and book an appointment first.
          </p>
        </>
      ) : (
        <>
          <h1>Complete Your Payment</h1>

          {error && <p className="error">{error}</p>}
          {success && (
            <p className="success">
              Payment successful! Redirecting to your dashboard...
            </p>
          )}

          <div className="card">
            {amount && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h2>Payment Amount: ₹{amount}</h2>
              </div>
            )}

            {(hasStripeConfig || hasCashfreeConfig) && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Payment Method:</strong>
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value);
                    setPaymentData(null);
                  }}
                  style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
                >
                  {hasCashfreeConfig && (
                    <option value="cashfree">Cashfree</option>
                  )}
                  {hasStripeConfig && (
                    <option value="stripe">Stripe (Card)</option>
                  )}
                </select>
              </div>
            )}

            {loading && !paymentData && <p>Initializing payment...</p>}

            {paymentData && !success && (
              <>
                {provider === 'cashfree' && hasCashfreeConfig ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleCashfreePayment}
                    disabled={loading}
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    {loading ? 'Processing...' : 'Pay with Cashfree'}
                  </button>
                ) : provider === 'stripe' && hasStripeConfig ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleStripePayment}
                    disabled={loading}
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    {loading ? 'Processing...' : 'Pay with Stripe'}
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={handleMockPayment}
                    disabled={loading}
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    {loading ? 'Processing...' : 'Pay Now (Mock)'}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1>Loading Payment...</h1>
          <p>Please wait...</p>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
