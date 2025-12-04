import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { createOrder, initiatePayment } from '../services/data';
import { ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import { Address, OrderStatus } from '../types';

// Declare Cashfree on window
declare global {
    interface Window {
        Cashfree: any;
    }
}

export const Payment: React.FC = () => {
  const { checkoutItems, user, shippingAddress, completeOrder, addNotification } = useShop();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState('cashfree'); // Default to Cashfree
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Cashfree SDK Instance
  const [cashfree, setCashfree] = useState<any>(null);

  // Initialize Cashfree SDK
  useEffect(() => {
      if (window.Cashfree) {
          setCashfree(new window.Cashfree({
              mode: "sandbox" // Change to "production" when live
          }));
      }
  }, []);
  
  // Ref to track if payment successfully finished to prevent redirect race condition
  const isPaymentCompleted = useRef(false);

  // Validate flow
  useEffect(() => {
      // If we just paid, don't redirect to cart even if items are cleared
      if (isPaymentCompleted.current) return;

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
        
        // 1. Call Backend to initiate Cashfree Session
        const paymentResponse = await initiatePayment(
            total, 
            orderId, 
            user?.email || 'guest@example.com', 
            user?.mobile || '9999999999'
        );

        if (paymentResponse.success && paymentResponse.paymentSessionId) {
            
            // Check if it's a mock session (Frontend Dev Mode)
            if (paymentResponse.paymentSessionId === "mock_session_id_for_dev_only") {
                 // Simulate Success for Dev
                 await finalizeOrder(orderId, 'Cashfree (Mock)');
                 return;
            }

            // 2. Trigger Cashfree Checkout
            if (cashfree) {
                cashfree.checkout({
                    paymentSessionId: paymentResponse.paymentSessionId,
                    redirectTarget: "_self", // Redirects in same tab or use "_modal"
                    returnUrl: window.location.origin + `/#/order-success/${orderId}` // Handler after payment
                });
                
                // Note: The actual order creation in DB typically happens via Webhook or verifying status on returnUrl
                // For this template, we pre-create pending order or handle it after redirect.
                // Here we assume successful redirect flow.
            } else {
                alert("Cashfree SDK not loaded");
                setIsProcessing(false);
            }

        } else {
            alert("Failed to initiate payment. Backend required for Session ID.");
            setIsProcessing(false);
        }

    } catch (error) {
        console.error("Payment Init Error", error);
        alert("Payment failed to initialize. Please try again.");
        setIsProcessing(false);
    }
  };

  const finalizeOrder = async (orderId: string, method: string) => {
        isPaymentCompleted.current = true;
        
        const newOrder = {
            id: orderId,
            userId: user?.id || 'guest',
            items: [...checkoutItems],
            total: total,
            status: 'Ordered' as OrderStatus,
            date: new Date().toISOString(),
            address: shippingAddress as Address,
            paymentMethod: method
        };

        await createOrder(newOrder);
        completeOrder(); // Clear cart items
        addNotification("Order Placed Successfully", `Your order ${orderId} has been confirmed.`, `/my-orders`);
        
        // Redirect immediately using 'replace' so user can't go back to payment page
        navigate(`/order-success/${orderId}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] pb-20 md:pb-8 font-sans page-animate">
        <div className="container mx-auto px-0 md:px-4 pt-2 md:pt-6 max-w-[1100px]">
            
            {/* Header Mobile */}
             <div className="bg-[#2874f0] p-4 text-white md:hidden flex items-center gap-3 sticky top-0 z-10 shadow-md">
                <button onClick={() => navigate('/order-summary')}><ArrowLeft className="w-6 h-6" /></button>
                <span className="font-medium text-lg">Payments</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mt-2 md:mt-4">
                 
                 {/* Left: Payment Options */}
                 <div className="flex-1">
                    
                    {/* Steps (Desktop) */}
                    <div className="bg-white shadow-sm mb-4 hidden md:flex rounded-[2px] overflow-hidden text-sm">
                        <div className="flex-1 p-3 border-r border-slate-200 text-slate-400 font-medium flex items-center gap-2 bg-slate-50">
                            <span className="bg-slate-200 text-slate-500 w-5 h-5 flex items-center justify-center text-[10px] rounded font-bold">1</span> Login <span className="ml-auto text-slate-800 font-bold text-xs">✓</span>
                        </div>
                        <div className="flex-1 p-3 border-r border-slate-200 text-slate-400 font-medium flex items-center gap-2 bg-slate-50">
                            <span className="bg-slate-200 text-slate-500 w-5 h-5 flex items-center justify-center text-[10px] rounded font-bold">2</span> Address <span className="ml-auto text-slate-800 font-bold text-xs">✓</span>
                        </div>
                         <div className="flex-1 p-3 border-r border-slate-200 text-slate-400 font-medium flex items-center gap-2 bg-slate-50">
                            <span className="bg-slate-200 text-slate-500 w-5 h-5 flex items-center justify-center text-[10px] rounded font-bold">3</span> Order Summary <span className="ml-auto text-slate-800 font-bold text-xs">✓</span>
                        </div>
                        <div className="flex-1 p-3 bg-[#2874f0] text-white font-medium flex items-center gap-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                            <span className="bg-white text-[#2874f0] w-5 h-5 flex items-center justify-center text-[10px] rounded font-bold">4</span> Payment
                        </div>
                    </div>

                    {/* Payment Methods List */}
                    <div className="bg-white shadow-sm rounded-[2px] overflow-hidden border border-slate-100">
                        <div className="p-3 bg-[#2874f0] text-white font-medium text-sm uppercase tracking-wide flex justify-between items-center">
                            <span>Payment Options</span>
                        </div>

                        {/* 1. Cashfree (Recommended) */}
                        <div className={`border-b border-slate-100 transition-colors ${paymentMethod === 'cashfree' ? 'bg-blue-50/20' : 'bg-white'}`}>
                            <label className="flex items-start gap-4 p-4 cursor-pointer">
                                <input type="radio" name="pm" className="mt-1 w-4 h-4 accent-[#2874f0]" checked={paymentMethod === 'cashfree'} onChange={() => setPaymentMethod('cashfree')} />
                                <div className="flex-1">
                                    <span className="font-medium text-slate-800">Cashfree Payments (UPI, Cards, NetBanking)</span>
                                    <p className="text-xs text-slate-500 mt-1">Pay securely using India's leading payment gateway.</p>
                                    
                                    {paymentMethod === 'cashfree' && (
                                        <div className="mt-4">
                                            <button 
                                                onClick={handlePay}
                                                disabled={isProcessing}
                                                className="bg-[#fb641b] text-white font-bold py-3 px-10 rounded-[2px] text-sm uppercase shadow-sm hover:bg-[#e85d19] transition-colors w-full md:w-auto"
                                            >
                                                {isProcessing ? 'Processing...' : `PAY ₹${total.toLocaleString('en-IN')}`}
                                            </button>
                                            <div className="flex gap-2 mt-3 items-center">
                                                <img src="https://img.icons8.com/color/48/upi.png" className="h-6 object-contain" alt="UPI"/>
                                                <img src="https://img.icons8.com/color/48/visa.png" className="h-6 object-contain" alt="Visa"/>
                                                <img src="https://img.icons8.com/color/48/mastercard.png" className="h-6 object-contain" alt="Mastercard"/>
                                                <span className="text-xs text-slate-400">+ More</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>

                        {/* 2. Cash on Delivery (Disabled) */}
                        <div className="bg-slate-50 opacity-70 cursor-not-allowed">
                            <div className="flex items-start gap-4 p-4">
                                <input type="radio" disabled className="mt-1 w-4 h-4 accent-slate-400" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-500">Cash on Delivery</span>
                                        <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Unavailable</span>
                                    </div>
                                    <div className="flex items-start gap-2 mt-2 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 inline-block">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>Due to high demand, Cash on Delivery is not available for this order. Please use Online Payment.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 bg-slate-50">
                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
                        </div>
                    </div>
                 </div>

                 {/* Right: Summary */}
                <div className="lg:w-1/3 w-full hidden md:block">
                   <div className="bg-white shadow-sm border border-slate-100 sticky top-20 rounded-[2px] overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-slate-50">
                         <h2 className="text-slate-500 font-bold uppercase text-sm">Price Details</h2>
                      </div>
                      <div className="p-4 space-y-4 text-sm">
                         <div className="flex justify-between">
                            <span className="text-slate-800">Price ({checkoutItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                            <span className="text-slate-800">₹{(subtotal + discount).toLocaleString('en-IN')}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-slate-800">Discount</span>
                            <span className="text-green-600">- ₹{discount.toLocaleString('en-IN')}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-slate-800">Delivery Charges</span>
                            <span className="text-green-600">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                         </div>
                         <div className="flex justify-between border-t border-dashed border-slate-200 pt-4 text-lg font-bold">
                            <span className="text-slate-900">Total Amount</span>
                            <span className="text-slate-900">₹{total.toLocaleString('en-IN')}</span>
                         </div>
                         <div className="text-green-600 font-medium pt-2 text-xs">
                            You will save ₹{discount.toLocaleString('en-IN')} on this order
                         </div>
                      </div>
                      
                      <div className="p-4 border-t border-slate-100">
                         <div className="flex items-center gap-3 mb-2">
                            <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/shield_5f9216.png" className="h-8" alt="Secure" />
                            <p className="text-xs text-slate-500 leading-tight">Safe and Secure Payments. Easy returns. 100% Authentic products.</p>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
        </div>
    </div>
  );
};