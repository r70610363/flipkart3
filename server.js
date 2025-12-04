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
// Corrected path for serving static files from the root
app.use(express.static(path.join(__dirname, 'dist')));

app.post('/api/payment/cashfree/initiate', async (req, res) => {
    try {
        const { order_amount, order_id, order_currency, customer_details } = req.body;

        const request = {
            order_amount,
            order_currency,
            order_id,
            customer_details,
            order_meta: {
                return_url: 'https://flipkart3-wq38.onrender.com/order/success?order_id={order_id}',
            }
        };

        const cashfree = new Cashfree({
            clientId: process.env.CASHFREE_CLIENT_ID,
            clientSecret: process.env.CASHFREE_CLIENT_SECRET,
        });

        const response = await cashfree.orders.create(request);
        res.json(response);
    } catch (error) {
        console.error("Cashfree Error", error);
        res.status(500).json({ success: false, message: "Payment initiation failed" });
    }
});

// Corrected path for the catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
