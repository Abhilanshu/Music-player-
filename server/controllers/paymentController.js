const Razorpay = require('razorpay');
const crypto = require('crypto');
const Invoice = require('../models/Invoice');
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/order
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { amount, currency, receipt } = req.body;

        const options = {
            amount: amount * 100, // Amount in smallest currency unit
            currency,
            receipt
        };

        const order = await razorpay.orders.create(options);

        if (!order) return res.status(500).send("Some error occured");

        res.json(order);
    } catch (error) {
        res.status(500).send(error);
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    try {
        const {
            orderCreationId,
            razorpayPaymentId,
            razorpayOrderId,
            razorpaySignature,
            invoiceId
        } = req.body;

        const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);

        shasum.update(`${orderCreationId}|${razorpayPaymentId}`);

        const digest = shasum.digest("hex");

        if (digest !== razorpaySignature)
            return res.status(400).json({ msg: "Transaction not legit!" });

        // Update Invoice Status
        const invoice = await Invoice.findById(invoiceId);
        if (invoice) {
            invoice.status = 'Paid';
            await invoice.save();
        }

        res.json({
            msg: "success",
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId
        });
    } catch (error) {
        res.status(500).send(error);
    }
};
