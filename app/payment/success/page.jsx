"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "../../../lib/api";

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [appointmentId, setAppointmentId] = useState(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const id = searchParams.get("appointmentId");
    const orderId = searchParams.get("order_id");
    const paymentIntentId = searchParams.get("payment_intent");
    const razorpayPaymentId = searchParams.get("razorpay_payment_id");
    const razorpayOrderId = searchParams.get("razorpay_order_id");
    const razorpaySignature = searchParams.get("razorpay_signature");

    const appointmentIdFromUrl = id || searchParams.get("appointmentId");

    if (appointmentIdFromUrl) {
      setAppointmentId(appointmentIdFromUrl);

      if (paymentIntentId) {
        verifyStripePayment(appointmentIdFromUrl, paymentIntentId);
      } else if (orderId) {
        verifyCashfreePayment(appointmentIdFromUrl, orderId);
      } else if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
        verifyRazorpayPayment(
          appointmentIdFromUrl,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature
        );
      } else {
        setVerifying(false);
      }
    } else if (orderId) {
      setVerifying(false);
    } else {
      router.push("/dashboard");
    }
  }, []);

  const verifyStripePayment = async (apptId, paymentIntentId) => {
    try {
      const appointmentsRes = await authApi().get("/appointments/my");
      const appointment = appointmentsRes.data.find(
        (a) => a.id === parseInt(apptId)
      );

      if (appointment && appointment.Payment) {
        await authApi().post("/payments/verify", {
          paymentId: appointment.Payment.id,
          provider: "stripe",
          paymentIntentId,
        });
      }
    } catch (err) {
      console.error("Payment verification error:", err);
    } finally {
      setVerifying(false);
    }
  };

  const verifyCashfreePayment = async (apptId, orderId) => {
    try {
      const appointmentsRes = await authApi().get("/appointments/my");
      const appointment = appointmentsRes.data.find(
        (a) => a.id === parseInt(apptId)
      );

      if (appointment && appointment.Payment) {
        await authApi().post("/payments/verify", {
          paymentId: appointment.Payment.id,
          provider: "cashfree",
          cashfreeOrderId: orderId,
        });
      }
    } catch (err) {
      console.error("Payment verification error:", err);
    } finally {
      setVerifying(false);
    }
  };

  const verifyRazorpayPayment = async (apptId, orderId, paymentId, signature) => {
    try {
      const appointmentsRes = await authApi().get("/appointments/my");
      const appointment = appointmentsRes.data.find(
        (a) => a.id === parseInt(apptId)
      );

      if (appointment && appointment.Payment) {
        await authApi().post("/payments/verify", {
          paymentId: appointment.Payment.id,
          provider: "razorpay",
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        });
      }
    } catch (err) {
      console.error("Payment verification error:", err);
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "2rem" }}>
        <h1>Verifying Payment...</h1>
        <p>Please wait while we confirm your payment.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "2rem" }}>
      <div className="card">
        <h1 style={{ color: "green" }}>✓ Payment Successful!</h1>
        <p>Your payment has been processed successfully.</p>
        <p>You will receive a confirmation email shortly.</p>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/dashboard")}
          style={{ marginTop: "1rem" }}
        >
          View My Appointments
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>}>
      <PaymentSuccessInner />
    </Suspense>
  );
}
