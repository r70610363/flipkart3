import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { createOrder, initiatePayment } from '../services/data';
import { ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import { Address } from '../types';

declare global {
    interface Window {
        Cashfree: any;
    }
}

export const Payment: React.FC = () => {
  const { checkoutItems, user, shippingAddress } = useShop();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState('cashfree');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashfree, setCashfree] = useState<any>(null);

  useEffect(() => {
      if (window.Cashfree) {
          setCashfree(new window.Cashfree({ mode: "sandbox" }));
      }
  }, []);

  useEffect(() => {
      if (!shippingAddress || checkoutItems.length === 0) {
          navigate('/cart');
      }
  }, [shippingAddress, checkoutItems, navigate]);

  const subtotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = checkoutItems.reduce((acc, item) => acc + ((item.originalPrice - item.price) * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  const handlePay = async () => {
    setIsProcessing(true);

    try {
        const orderId = `ORD-${Date.now()}`;

        // 1. Create a 'Pending' order in the database FIRST.
        // This ensures an order record exists before we even try to charge the user.
        await createOrder({
            id: orderId,
            userId: user?.id || 'guest',
            items: [...checkoutItems],
            total: total,
            status: 'Pending', // IMPORTANT: New status
            date: new Date().toISOString(),
            address: shippingAddress as Address,
            paymentMethod: 'Cashfree'
        });

        // 2. Call Backend to get a real Cashfree Session ID
        const paymentResponse = await initiatePayment(
            total, 
            orderId, 
            user?.email || 'guest@example.com', 
            user?.mobile || '9999999999'
        );

        if (paymentResponse.success && paymentResponse.paymentSessionId) {
            // 3. Trigger Cashfree Checkout Popup
            if (cashfree) {
                cashfree.checkout({
                    paymentSessionId: paymentResponse.paymentSessionId,
                    redirectTarget: "_self",
                    // The returnUrl is now configured on the backend for security.
                    // The user will be redirected to OrderSuccess page automatically by Cashfree.
                });
            } else {
                alert("Cashfree SDK not loaded. Please refresh and try again.");
                setIsProcessing(false);
            }
        } else {
            alert("Failed to initiate payment session. Please try again.");
            setIsProcessing(false);
        }

    } catch (error) {
        console.error("Payment Process Error", error);
        alert("A critical error occurred during payment processing. Please try again.");
        setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] pb-20 md:pb-8 font-sans page-animate">
        <div className="container mx-auto px-0 md:px-4 pt-2 md:pt-6 max-w-[1100px]">
            
            {/* Header and Steps UI (no changes) */}
            <div className="bg-[#2874f0] p-4 text-white md:hidden flex items-center gap-3 sticky top-0 z-10 shadow-md">
                <button onClick={() => navigate('/order-summary')}><ArrowLeft className="w-6 h-6" /></button>
                <span className="font-medium text-lg">Payments</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mt-2 md:mt-4">
                 
                 <div className="flex-1">
                    <div className="bg-white shadow-sm mb-4 hidden md:flex rounded-[2px] overflow-hidden text-sm">
                        {/* Steps UI ... */}
                    </div>

                    {/* Payment Methods List */}
                    <div className="bg-white shadow-sm rounded-[2px] overflow-hidden border border-slate-100">
                        <div className="p-3 bg-[#2874f0] text-white font-medium text-sm uppercase tracking-wide">
                            Payment Options
                        </div>

                        {/* Cashfree Option */}
                        <div className={`border-b border-slate-100 transition-colors bg-blue-50/20`}>
                            <label className="flex items-start gap-4 p-4 cursor-pointer">
                                <input type="radio" name="pm" className="mt-1 w-4 h-4 accent-[#2874f0]" checked readOnly />
                                <div className="flex-1">
                                    <span className="font-medium text-slate-800">Cashfree Payments (UPI, Cards, etc.)</span>
                                    <p className="text-xs text-slate-500 mt-1">Pay securely using India's leading payment gateway.</p>
                                    
                                    <div className="mt-4">
                                        <button 
                                            onClick={handlePay}
                                            disabled={isProcessing}
                                            className="bg-[#fb641b] text-white font-bold py-3 px-10 rounded-[2px] text-sm uppercase shadow-sm hover:bg-[#e85d19] transition-colors w-full md:w-auto disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Connecting to Gateway...' : `PAY SECURELY ₹${total.toLocaleString('en-IN')}`}
                                        </button>
                                        {/* Icons */}
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Disabled COD */}
                        <div className="bg-slate-50 opacity-70 cursor-not-allowed">
                           {/* COD UI ... */}
                        </div>

                        <div className="p-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 bg-slate-50">
                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                            <span>Safe and Secure Payments. 100% Authentic products.</span>
                        </div>
                    </div>
                 </div>

                 {/* Right: Price Summary (no changes) */}
                 <div className="lg:w-1/3 w-full hidden md:block">
                   {/* Summary UI ... */}
                </div>
            </div>
        </div>
    </div>
  );
};