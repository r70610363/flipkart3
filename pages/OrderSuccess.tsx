import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Truck, AlertTriangle, Loader2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Order } from '../types';
import { verifyPayment, confirmOrder, fetchOrderById } from '../services/data';

type VerificationStatus = 'verifying' | 'success' | 'failed' | 'already-processed';

export const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { completeOrder, addNotification } = useShop();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<VerificationStatus>('verifying');

  // Ref to prevent double-processing in React 18's Strict Mode
  const verificationRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleVerification = async () => {
      if (!orderId) {
        navigate('/my-orders');
        return;
      }

      // --- Prevent double run in development ---
      if (verificationRef.current) return;
      verificationRef.current = true;
      // ----------------------------------------
      
      // 1. Check if the order is already processed and marked as 'Ordered'
      const existingOrder = await fetchOrderById(orderId);
      if (existingOrder && existingOrder.status === 'Ordered') {
          setOrder(existingOrder);
          setStatus('already-processed');
          return;
      }

      // 2. If not, verify the payment with the backend
      const verificationResult = await verifyPayment(orderId);

      if (verificationResult.success && verificationResult.status === 'PAID') {
        // 3. Payment is successful! Confirm the order in our database.
        const confirmedOrder = await confirmOrder(orderId, 'Cashfree');
        if (confirmedOrder) {
          setOrder(confirmedOrder);
          setStatus('success');
          // IMPORTANT: Only clear cart and notify AFTER successful verification and confirmation
          completeOrder();
          addNotification("Order Placed Successfully!", `Order ${orderId} confirmed.`, `/my-orders`);
        } else {
          setStatus('failed'); // Should not happen if verification is correct
        }
      } else {
        // 4. Payment was not successful or verification failed.
        setStatus('failed');
      }
    };

    handleVerification();

  }, [orderId, navigate, completeOrder, addNotification]);

  // --- RENDER LOGIC ---

  if (status === 'verifying') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="w-12 h-12 text-[#2874f0] animate-spin mb-4" />
        <h1 className="text-xl font-bold text-slate-700">Verifying Payment...</h1>
        <p className="text-slate-500 mt-2">Please wait while we confirm your payment status. Do not refresh or go back.</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-red-600">Payment Failed or Pending</h1>
        <p className="text-slate-500 mt-2">Your payment could not be confirmed. If you believe you were charged, please contact customer support.</p>
        <p className="text-slate-500 mt-1">Order ID: {orderId}</p>
        <Link to="/cart" className="mt-6 bg-[#fb641b] text-white font-bold py-3 px-8 rounded-[2px] text-sm uppercase">Return to Cart</Link>
      </div>
    );
  }

  if (!order) { // This case now acts as a fallback for unexpected errors
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
              <h1 className="text-xl font-bold">Error</h1>
              <p className="text-slate-500 mt-2">Could not load order details.</p>
              <Link to="/my-orders" className="mt-4 bg-[#2874f0] text-white font-bold py-3 px-8 rounded-[2px] text-sm uppercase">Go to My Orders</Link>
          </div>
      );
  }

  // --- SUCCESS UI (Only shown after successful verification) ---
  return (
    <div className="min-h-screen bg-[#f1f3f6] py-8 px-4">
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-[4px] shadow-sm border border-slate-200 overflow-hidden mb-6 text-center p-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Order Placed Successfully!</h1>
                <p className="text-slate-500 text-sm mb-6">Thank you! Your payment has been confirmed.</p>
                <div className="bg-slate-50 rounded p-4 inline-block border border-slate-100 mb-6">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Order ID</p>
                    <p className="text-lg font-bold text-[#2874f0] tracking-wide">{order.id}</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 justify-center">
                    <Link to={`/track-order/${order.id}`} className="bg-[#2874f0] text-white font-bold py-3 px-8 rounded-[2px] text-sm uppercase flex items-center justify-center gap-2">
                        <Package className="w-4 h-4" /> Track Order
                    </Link>
                    <Link to="/" className="bg-white text-[#2874f0] border border-[#2874f0] font-bold py-3 px-8 rounded-[2px] text-sm uppercase flex items-center justify-center gap-2">
                        Continue Shopping <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {order.address && (
              <div className="bg-white rounded-[4px] shadow-sm border border-slate-200 overflow-hidden p-6">
                  <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#2874f0]" /> Delivery Details
                  </h2>
                  {/* Delivery details UI ... */}
              </div>
            )}
        </div>
    </div>
  );
};