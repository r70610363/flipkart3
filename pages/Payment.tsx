import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

const UnavailableOption: React.FC<{title: string}> = ({ title }) => (
    <div className="border-b border-slate-100 bg-slate-50 opacity-60">
        <label className="flex items-center gap-4 p-4 cursor-not-allowed">
            <input type="radio" name="pm" className="mt-1 w-4 h-4" disabled />
            <div className="flex-1">
                <span className="font-medium text-slate-600">{title}</span>
                <p className="text-xs text-red-500 font-medium mt-1">Temporarily unavailable</p>
            </div>
        </label>
    </div>
);

export const Payment: React.FC = () => {
  const { checkoutItems, shippingAddress } = useShop();
  const navigate = useNavigate();

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

                        <UnavailableOption title="Paytm" />
                        <UnavailableOption title="PhonePe" />
                        <UnavailableOption title="Google Pay" />
                        <UnavailableOption title="UPI" />
                        <UnavailableOption title="Debit Card" />
                        <UnavailableOption title="Credit Card" />
                        <UnavailableOption title="Cash on Delivery" />
                    </div>

                    <div className="bg-white shadow-lg mt-4 p-4 flex justify-end">
                        <button 
                            disabled={true}
                            className="bg-[#fb641b] text-white font-bold py-3 px-10 rounded-[2px] text-sm uppercase shadow-sm w-full md:w-auto disabled:opacity-50 cursor-not-allowed"
                        >
                            Continue
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