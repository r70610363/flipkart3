
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ShieldCheck, ArrowLeft, CreditCard, Wallet, IndianRupee, Truck, Loader2 } from 'lucide-react';

const PaymentOption: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    selectedMethod: string | null;
    onSelect: (value: string) => void;
}> = ({ title, value, icon, selectedMethod, onSelect }) => (
    <div className={`border-b border-slate-200 transition-colors ${selectedMethod === value ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}>
        <label className="flex items-center gap-4 p-4 cursor-pointer">
            <input
                type="radio"
                name="paymentMethod"
                value={value}
                checked={selectedMethod === value}
                onChange={() => onSelect(value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
            />
            <div className="flex items-center gap-3">
                {icon}
                <span className="font-medium text-slate-700">{title}</span>
            </div>
        </label>
    </div>
);


export const Payment: React.FC = () => {
  const { checkoutItems, shippingAddress, user, addNotification, completeOrder, createNewOrder } = useShop();
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
      if (!shippingAddress || checkoutItems.length === 0) {
          navigate('/cart');
      }
  }, [shippingAddress, checkoutItems, navigate]);

  const subtotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = checkoutItems.reduce((acc, item) => acc + ((item.originalPrice - item.price) * item.quantity), 0);
  const grossTotal = subtotal + discount;
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;
  
  const paymentOptions = [
    { title: 'Paytm', value: 'Paytm', icon: <Wallet className="w-5 h-5 text-blue-500" /> },
    { title: 'PhonePe', value: 'PhonePe', icon: <Wallet className="w-5 h-5 text-purple-600" /> },
    { title: 'Google Pay', value: 'GooglePay', icon: <Wallet className="w-5 h-5 text-green-500" /> },
    { title: 'UPI', value: 'UPI', icon: <IndianRupee className="w-5 h-5 text-slate-600" /> },
    { title: 'Debit Card', value: 'DebitCard', icon: <CreditCard className="w-5 h-5 text-slate-600" /> },
    { title: 'Credit Card', value: 'CreditCard', icon: <CreditCard className="w-5 h-5 text-slate-600" /> },
    { title: 'Cash on Delivery', value: 'COD', icon: <Truck className="w-5 h-5 text-slate-600" /> },
  ];

  const handlePayment = async () => {
    if (!selectedMethod || !user || !shippingAddress) return;
    setIsProcessing(true);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const orderId = await createNewOrder(selectedMethod, total);

    if (orderId) {
        completeOrder(); // Clear cart and checkout state
        addNotification(
            "Order Placed Successfully!",
            `Your order #${orderId} is confirmed.`,
            `/track-order/${orderId}`
        );
        navigate(`/order-success/${orderId}`);
    } else {
        addNotification(
            "Order Failed",
            "There was an issue placing your order. Please try again.",
            "/cart"
        );
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] pb-20 md:pb-8 font-sans page-animate">
        <div className="container mx-auto px-0 md:px-4 pt-2 md:pt-6 max-w-[1100px]">
            
            <div className="bg-[#2874f0] p-4 text-white md:hidden flex items-center gap-3 sticky top-0 z-10 shadow-md">
                <button onClick={() => navigate('/order-summary')}><ArrowLeft className="w-6 h-6" /></button>
                <span className="font-medium text-lg">Payments</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mt-2 md:mt-4">
                 <div className="flex-1">
                    <div className="bg-white shadow-sm rounded-[2px] overflow-hidden border border-slate-100">
                        <div className="p-3 bg-[#2874f0] text-white font-medium text-sm uppercase tracking-wide">
                            Payment Options
                        </div>

                        {paymentOptions.map(opt => (
                            <PaymentOption 
                                key={opt.value}
                                {...opt}
                                selectedMethod={selectedMethod}
                                onSelect={setSelectedMethod}
                            />
                        ))}
                    </div>

                    <div className="bg-white shadow-lg mt-4 p-4 flex justify-end">
                        <button 
                            onClick={handlePayment}
                            disabled={!selectedMethod || isProcessing}
                            className="bg-[#fb641b] text-white font-bold py-3 px-10 rounded-[2px] text-sm uppercase shadow-sm w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </div>

                    <div className="p-4 mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <span>Safe and Secure Payments. 100% Authentic products.</span>
                    </div>
                 </div>

                 <div className="lg:w-1/3 w-full hidden md:block">
                   <div className="bg-white shadow-sm rounded-[2px] overflow-hidden text-sm">
                        <div className="p-3 bg-white border-b border-slate-200">
                            <h2 className="font-bold uppercase text-slate-500">Price Details</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between">
                                <span>Price ({checkoutItems.length} items)</span>
                                <span>₹{grossTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Discount</span>
                                <span className="text-green-600">- ₹{discount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery Charges</span>
                                <span>{shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping}`}</span>
                            </div>
                            <div className="border-t border-dashed border-slate-300 my-2"></div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Amount</span>
                                <span>₹{total.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="border-t border-dashed border-slate-300 my-2"></div>
                            <p className="text-green-600 font-bold text-center">You will save ₹{discount.toLocaleString('en-IN')} on this order</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
