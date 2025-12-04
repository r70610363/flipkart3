import express from 'express';
import cors from 'cors';
import { Cashfree } from 'cashfree-pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize Cashfree credentials outside the handlers
// to avoid re-instantiation on every request.
const cashfree = new Cashfree({
    clientId: process.env.CASHFREE_CLIENT_ID,
    clientSecret: process.env.CASHFREE_CLIENT_SECRET,
});

app.post('/api/payment/cashfree/initiate', async (req, res) => {
    try {
        const { order_amount, order_id, order_currency, customer_details } = req.body;

        const request = {
            order_amount,
            order_currency,
            order_id,
            customer_details,
            order_meta: {
                // Updated return_url to match the React Router hash format
                return_url: `https://flipkart3-wq38.onrender.com/#/order-success/${order_id}`,
            },
            order_note: `Order ${order_id} for Flipkart-Clone`
        };

        const response = await cashfree.orders.create(request);
        // Send back only what's needed: the session ID for the checkout SDK
        res.json({ success: true, payment_session_id: response.payment_session_id });

    } catch (error) {
        console.error("Cashfree Initiation Error", error);
        res.status(500).json({ success: false, message: "Payment initiation failed" });
    }
});

// NEW ENDPOINT for verifying the payment status from the server-side
app.get('/api/payment/cashfree/verify/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        // Use the same cashfree instance to fetch order details
        const order = await cashfree.orders.get(orderId);

        // Send back the crucial status information to the frontend
        res.json({
            success: true,
            order_id: order.order_id,
            order_status: order.order_status, // e.g., 'PAID', 'ACTIVE', 'EXPIRED'
            customer_details: order.customer_details,
        });

    } catch (error) {
        console.error("Cashfree Verification Error", error);
        res.status(500).json({ success: false, message: "Payment verification failed" });
    }
});

// Corrected path for the catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Using Render's port or a default
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
