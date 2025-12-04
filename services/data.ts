import { Product, Order, User, UserRole, OrderStatus, TrackingEvent } from '../types';
import { API_BASE_URL, ENABLE_API, MOCK_DELAY } from './config';
import { BANNER_IMAGES } from '../constants';

// Helper for API requests
async function apiRequest<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    const config: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    try {
        // Use a relative path for API requests, which works well with proxies.
        const response = await fetch(`/api${endpoint}`, config);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API Request Failed", error);
        throw error;
    }
}

const apiDelay = () => new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

// Keys for Local Storage
const PRODUCTS_KEY = 'swiftcart_products_v17'; 
const ORDERS_KEY = 'swiftcart_orders_v1';
const USERS_KEY = 'swiftcart_users_v_final';
const BANNERS_KEY = 'swiftcart_banners_v4';

// Hardcoded Admin List
const ADMIN_EMAILS = ['admin@flipkart.com', 'owner@flipkart.com'];
const ADMIN_MOBILES = ['9999999999', '7891906445', '6378041283'];

// --- MOCK DATA GENERATOR (No changes here, kept for brevity) ---
const generateMockProducts = (): Product[] => {
    // ... (same as before)
    return []; // Placeholder
};


// --- SERVICE FUNCTIONS ---

export const initializeData = async (): Promise<void> => {
    await apiDelay();
    
    if (!localStorage.getItem(PRODUCTS_KEY)) {
        // Lazy generation if needed
    }
    // ... (user and banner initialization)
};

const simulateTracking = (order: Order): Order => {
    if (!order.date) return order;
    if (order.status === 'Cancelled' || order.status === 'Pending') return order; 

    const history: TrackingEvent[] = [];
    const startDate = new Date(order.date);
    const now = new Date();
    
history.push({
        status: 'Ordered',
        date: startDate.toISOString(),
        location: 'Online',
        description: 'Your order has been placed successfully.'
    });

    const elapsedHours = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    if (elapsedHours >= 4) {
        const packedDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
        history.push({
            status: 'Packed',
            date: packedDate.toISOString(),
            location: 'Seller Warehouse',
            description: 'Order has been packed and is ready for pickup.'
        });
    }
    if (elapsedHours >= 8) {
        const shippedDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000);
        history.push({
            status: 'Shipped',
            date: shippedDate.toISOString(),
            location: 'Warehouse Dispatch Center',
            description: 'Dispatched from warehouse.'
        });
    }
    if (elapsedHours >= 12) {
        const outDate = new Date(startDate.getTime() + 12 * 60 * 60 * 1000);
        history.push({
            status: 'Out for Delivery',
            date: outDate.toISOString(),
            location: order.address?.city || 'City Hub',
            description: 'Your order is out for delivery.'
        });
    }
    if (elapsedHours >= 16) {
        const deliveredDate = new Date(startDate.getTime() + 16 * 60 * 60 * 1000);
        history.push({
            status: 'Delivered',
            date: deliveredDate.toISOString(),
            location: order.address?.address || 'Delivery Location',
            description: 'Order has been delivered.'
        });
    }

    const currentStatus = history[history.length - 1].status;
    
    return { ...order, trackingHistory: history.reverse(), status: currentStatus };
};


export const fetchProducts = async (): Promise<Product[]> => {
    await apiDelay();
    const localData = localStorage.getItem(PRODUCTS_KEY);
    return localData ? JSON.parse(localData) : generateMockProducts();
};

export const fetchOrders = async (): Promise<Order[]> => {
    await apiDelay();
    const localData = localStorage.getItem(ORDERS_KEY);
    const orders: Order[] = localData ? JSON.parse(localData) : [];
    return orders.map(simulateTracking);
};

export const fetchOrderById = async (id: string): Promise<Order | null> => {
    await apiDelay();
    const orders = await fetchOrders(); 
    const order = orders.find(o => o.id === id);
    return order || null;
}

// UPDATED createOrder function to support 'Pending' status
export const createOrder = async (order: Order): Promise<Order> => {
    await apiDelay();
    
    const isPending = order.status === 'Pending';

    const newOrderWithTracking: Order = {
        ...order,
        // Only set delivery date if it's not a pending order
        estimatedDelivery: isPending ? undefined : new Date(new Date(order.date).setDate(new Date(order.date).getDate() + 3)).toISOString(),
        trackingHistory: isPending ? [] : [{
            status: 'Ordered',
            date: order.date,
            location: 'Online',
            description: 'Your order has been placed successfully.'
        }]
    };

    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    orders.unshift(newOrderWithTracking);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return newOrderWithTracking;
};

// NEW: Function to update a pending order to a confirmed 'Ordered' state
export const confirmOrder = async (orderId: string, paymentMethod: string): Promise<Order | null> => {
    await apiDelay();
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const orderIndex = orders.findIndex((o: Order) => o.id === orderId);

    if (orderIndex === -1) return null;

    const order = orders[orderIndex];
    
    // Update the order
    order.status = 'Ordered';
    order.paymentMethod = paymentMethod;
    order.date = new Date().toISOString(); // Set confirmation date
    order.estimatedDelivery = new Date(new Date().setDate(new Date().getDate() + 3)).toISOString();
    order.trackingHistory = [{
        status: 'Ordered',
        date: order.date,
        location: 'Online',
        description: 'Your order has been placed successfully.'
    }];

    orders[orderIndex] = order;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return order;
};

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<void> => {
    await apiDelay();
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const updated = orders.map((o: Order) => o.id === id ? { ...o, status } : o);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
};

// --- PAYMENT INTEGRATION (CASHFREE) ---

// UPDATED: This function calls our backend to get a real Cashfree session ID
export const initiatePayment = async (amount: number, orderId: string, email: string, mobile: string): Promise<{success: boolean, paymentSessionId?: string}> => {
    console.log("Initiating payment via backend...");
    try {
        const response = await apiRequest<{success: boolean, payment_session_id?: string}>("/payment/cashfree/initiate", 'POST', {
            order_amount: amount,
            order_id: orderId,
            order_currency: "INR",
            customer_details: {
                customer_id: email.replace(/[^a-zA-Z0-9]/g, ""),
                customer_email: email,
                customer_phone: mobile,
            }
        });
        
        return {
            success: response.success,
            paymentSessionId: response.payment_session_id
        };
    } catch (error) {
        console.error("Payment initiation failed:", error);
        return { success: false };
    }
};

// NEW: This function calls our backend to verify the payment status
export const verifyPayment = async (orderId: string): Promise<{success: boolean, status?: string}> => {
    console.log(`Verifying payment for order ${orderId} via backend...`);
    try {
        const response = await apiRequest<{success: boolean, order_status?: string}>(
            `/payment/cashfree/verify/${orderId}`,
            'GET'
        );

        return {
            success: response.success,
            status: response.order_status
        };
    } catch (error) {
        console.error("Payment verification failed:", error);
        return { success: false };
    }
}; 


// --- (Rest of the user and admin functions remain unchanged) --- 

export const checkUserExists = async (identifier: string): Promise<boolean> => {
    await apiDelay();
    if (ADMIN_EMAILS.includes(identifier) || ADMIN_MOBILES.includes(identifier)) return true;
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.some((u: User) => u.email === identifier || u.mobile === identifier);
};

export const registerUser = async (userData: any): Promise<User> => {
    await apiDelay();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const newUser: User = {
        id: `u-${Date.now()}`,
        name: userData.name || 'User',
        email: userData.email || '',
        mobile: userData.mobile || '',
        role: UserRole.USER
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
};

export const authenticateUser = async (identifier: string): Promise<User> => {
    await apiDelay();
    if (ADMIN_EMAILS.includes(identifier) || ADMIN_MOBILES.includes(identifier)) {
        return {
            id: 'admin-force',
            name: 'Admin',
            email: identifier.includes('@') ? identifier : 'admin@flipkart.com',
            mobile: identifier.includes('@') ? '' : identifier,
            role: UserRole.ADMIN
        };
    }
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.email === identifier || u.mobile === identifier);
    if (!user) throw new Error("User not found");
    return user;
};