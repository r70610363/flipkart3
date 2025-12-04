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

// --- BANNER FUNCTIONS ---

export const fetchBanners = async (): Promise<string[]> => {
    await apiDelay();
    const localData = localStorage.getItem(BANNERS_KEY);
    return localData ? JSON.parse(localData) : BANNER_IMAGES;
};

export const saveBanners = async (banners: string[]): Promise<void> => {
    await apiDelay();
    localStorage.setItem(BANNERS_KEY, JSON.stringify(banners));
};

// --- PRODUCT FUNCTIONS ---

export const saveProduct = async (product: Product): Promise<void> => {
    await apiDelay();
    const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    const index = products.findIndex((p: Product) => p.id === product.id);
    if (index !== -1) {
        products[index] = product;
    } else {
        products.push(product);
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const deleteProduct = async (id: string): Promise<void> => {
    await apiDelay();
    let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    products = products.filter((p: Product) => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};


// --- SERVICE FUNCTIONS ---

export const initializeData = async (): Promise<void> => {
    await apiDelay();
    const localProducts = localStorage.getItem(PRODUCTS_KEY);
    if (!localProducts || JSON.parse(localProducts).length === 0) {
        try {
            const response = await fetch('/products.json'); 
            const products = await response.json();
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        } catch (error) {
            console.error("Failed to fetch initial product data:", error);
        }
    }
};

const simulateTracking = (order: Order): Order => {
    if (!order.date || order.status === 'Cancelled' || order.status === 'Pending') return order; 

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
        history.push({
            status: 'Packed',
            date: new Date(startDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
            location: 'Seller Warehouse',
            description: 'Order has been packed and is ready for pickup.'
        });
    }
    if (elapsedHours >= 8) {
        history.push({
            status: 'Shipped',
            date: new Date(startDate.getTime() + 8 * 60 * 60 * 1000).toISOString(),
            location: 'Warehouse Dispatch Center',
            description: 'Dispatched from warehouse.'
        });
    }

    const currentStatus = history[history.length - 1].status;
    return { ...order, trackingHistory: history.reverse(), status: currentStatus };
};

export const fetchProducts = async (): Promise<Product[]> => {
    await apiDelay();
    const localData = localStorage.getItem(PRODUCTS_KEY);
    return localData ? JSON.parse(localData) : [];
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

export const createOrder = async (order: Order): Promise<Order> => {
    await apiDelay();
    const isPending = order.status === 'Pending';
    const newOrder: Order = {
        ...order,
        estimatedDelivery: isPending ? undefined : new Date(new Date(order.date).setDate(new Date(order.date).getDate() + 3)).toISOString(),
        trackingHistory: isPending ? [] : [{
            status: 'Ordered',
            date: order.date,
            location: 'Online',
            description: 'Your order has been placed successfully.'
        }]
    };
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    orders.unshift(newOrder);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return newOrder;
};

export const confirmOrder = async (orderId: string, paymentMethod: string): Promise<Order | null> => {
    await apiDelay();
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const orderIndex = orders.findIndex((o: Order) => o.id === orderId);

    if (orderIndex === -1) return null;

    const order = orders[orderIndex];
    order.status = 'Ordered';
    order.paymentMethod = paymentMethod;
    order.date = new Date().toISOString();
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

export const initiatePayment = async (amount: number, orderId: string, email: string, mobile: string): Promise<{success: boolean, paymentSessionId?: string}> => {
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

export const verifyPayment = async (orderId: string): Promise<{success: boolean, status?: string}> => {
    try {
        const response = await apiRequest<{success: boolean, order_status?: string}>(
            `/payment/cashfree/verify/${orderId}`,
            'GET'
        );
        return { success: response.success, status: response.order_status };
    } catch (error) {
        console.error("Payment verification failed:", error);
        return { success: false };
    }
}; 

// --- USER MANAGEMENT ---

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

export const updateUser = async (updatedUser: User): Promise<User> => {
    await apiDelay();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === updatedUser.id);
    if (index !== -1) {
        users[index] = updatedUser;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return updatedUser;
    }
    throw new Error("User not found for update");
};