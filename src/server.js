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
app.use(express.static(path.join(__dirname, '../dist')));

// The following lines were removed as they are incorrect for cashfree-pg v5 and caused the crash.
// Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
// Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
// Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

app.post('/api/payment/cashfree/initiate', async (req, res) => {
    try {
        const { order_amount, order_id, order_currency, customer_details } = req.body;

        const request = {
            order_amount,
            order_currency,
            order_id,
            customer_details,
            order_meta: {
                // Return url is where cashfree will redirect the user after payment
                // This should be a url on your frontend application
                return_url: 'https://flipkart3-wq38.onrender.com/order/success?order_id={order_id}',
            }
        };

        // Correctly initialize the Cashfree instance for v5
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
