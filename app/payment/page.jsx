'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '../../lib/api';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [appointmentId, setAppointmentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [provider, setProvider] = useState('cashfree'); // Default to cashfree, or 'stripe', 'razorpay'

  useEffect(() => {
    const id = searchParams.get('appointmentId');
    if (!id) {
      setError('Missing appointment ID. Please book an appointment first.');
      setAppointmentId(null);
    } else {
      setAppointmentId(id);
    }
  }, [searchParams]);

  useEffect(() => {
    if (appointmentId && provider) {
      loadPaymentIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, provider]);

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
      setError(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    if (!paymentData?.clientSecret) {
      setError('Payment not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Load Stripe.js dynamically
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key');

      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

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
      // If successful, user will be redirected to success page
    } catch (err) {
      setError(err.message || 'Payment processing failed');
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!paymentData?.orderId) {
      setError('Payment not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: paymentData.keyId,
          amount: paymentData.amount * 100, // Convert to paise
          currency: paymentData.currency,
          name: 'Salon Booking',
          description: 'Appointment Payment',
          order_id: paymentData.orderId,
          handler: async function (response) {
            // Verify payment on backend
            try {
              await authApi().post('/payments/verify', {
                paymentId: paymentData.paymentId,
                provider: 'razorpay',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              setSuccess(true);
              setTimeout(() => {
                router.push('/dashboard');
              }, 2000);
            } catch (err) {
              setError(err.response?.data?.message || 'Payment verification failed');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            // You can prefill customer details here
          },
          theme: {
            color: '#111827',
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response) {
          setError(response.error.description || 'Payment failed');
          setLoading(false);
        });
        razorpay.open();
      };
      script.onerror = () => {
        setError('Failed to load Razorpay checkout');
        setLoading(false);
      };
      document.body.appendChild(script);
    } catch (err) {
      setError(err.message || 'Payment processing failed');
      setLoading(false);
    }
  };

  const handleCashfreePayment = async () => {
    if (!paymentData?.paymentSessionId || !paymentData?.appId) {
      setError('Payment not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Load Cashfree checkout script
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
      setError(err.message || 'Payment processing failed');
      setLoading(false);
    }
  };

  const handleMockPayment = async () => {
    if (!appointmentId) return;
    setLoading(true);
    setError('');
    try {
      const res = await authApi().post('/payments', {
        appointmentId: Number(appointmentId),
        provider: 'stripe',
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!appointmentId) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1>Complete Your Payment</h1>
        <p className="error">Missing appointment. Go back and book an appointment first.</p>
      </div>
    );
  }

  const amount = paymentData?.amount || null;
  const hasStripeConfig = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const hasRazorpayConfig = paymentData?.keyId;
  const hasCashfreeConfig = paymentData?.appId;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Complete Your Payment</h1>

      {error && <p className="error">{error}</p>}
      {success && (
        <p className="success">Payment successful! Redirecting to your dashboard...</p>
      )}

      <div className="card">
        {amount && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2>Payment Amount: ₹{amount}</h2>
          </div>
        )}

        {/* Payment Provider Selection */}
        {(hasStripeConfig || hasRazorpayConfig || hasCashfreeConfig) && (
          <div style={{ marginBottom: '1rem' }}>
            <label>
              <strong>Payment Method:</strong>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setPaymentData(null);
                }}
                style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
              >
                {hasCashfreeConfig && <option value="cashfree">Cashfree</option>}
                {hasStripeConfig && <option value="stripe">Stripe (Card)</option>}
                {hasRazorpayConfig && <option value="razorpay">Razorpay</option>}
              </select>
            </label>
          </div>
        )}

        {loading && !paymentData && <p>Initializing payment...</p>}

        {paymentData && !success && (
          <div>
            {provider === 'cashfree' && hasCashfreeConfig ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCashfreePayment}
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {loading ? 'Processing...' : 'Pay with Cashfree'}
              </button>
            ) : provider === 'stripe' && hasStripeConfig ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStripePayment}
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {loading ? 'Processing...' : 'Pay with Stripe'}
              </button>
            ) : provider === 'razorpay' && hasRazorpayConfig ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRazorpayPayment}
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {loading ? 'Processing...' : 'Pay with Razorpay'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleMockPayment}
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {loading ? 'Processing...' : 'Pay Now (Mock Payment)'}
              </button>
            )}
          </div>
        )}

        {!hasStripeConfig && !hasRazorpayConfig && !hasCashfreeConfig && (
          <div>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Payment gateways not configured. Using mock payment for testing.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleMockPayment}
              disabled={loading}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {loading ? 'Processing...' : 'Pay Now (Mock Payment)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '2rem' }}>
        <h1>Loading Payment...</h1>
        <p>Please wait...</p>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
