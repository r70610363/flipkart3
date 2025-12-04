const express = require('express');
const cors = require('cors');
const { Cashfree } = require('cashfree-pg');

const app = express();

app.use(cors());
app.use(express.json());

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

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
                return_url: 'https://flipkart-clone-70d37.web.app/order/success?order_id={order_id}',
            }
        };

        const response = await cashfree.orders.create(request);
        res.json(response);
    } catch (error) {
        console.error("Cashfree Error", error);
        res.status(500).json({ success: false, message: "Payment initiation failed" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
