const express = require("express");
const { userAuth } = require("../middleware/auth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const paymentRouter = express.Router();
const { memberShipAmount } = require("../utils/constants");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
const { validate } = require("../models/connectionRequest");
const User = require("../models/user");

paymentRouter.post("/create", userAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    const { firstName, lastName, emailId } = req.user;
    const order = await razorpayInstance.orders.create({
      amount: memberShipAmount[plan] * 100,
      currency: "INR",
      receipt: `receipt_order_${Math.random() * 1000}`,
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType: plan,
      },
    });

    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });

    const savedPayment = await payment.save();

     res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

paymentRouter.post("/webhook", async (req, res) => {
  try {
    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      req.get["x-Razorpay-Signature"],
      process.env.RAZORPAY_WEBHOOK_SECRET
    );
    if (!isWebhookValid) {
      return res.status(400).send("Invalid signature");
    }
    const paymentDetails = req.body.payload.payment.entity;

    const payment = await Payment.findOne({ orderId: paymentDetails.order_id });

    payment.status = paymentDetails.status;
    await payment.save();
    const user = await User.findOne({ _id: payment.userId });
    user.isPremium = true;
    user.memberShipType = paymentDetails.notes.membershipType;
    await user.save();
    // if (req.body.event === "payment.captured") {
    // }
    // if (req.body.event === "payment.failed") {
    // }
    return res.status(200).send("Webhook received");
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
try {
  const user = req.user;
  if (user.isPremium) {
    return res.json({isPremium: true});
  }
  return  res.json({isPremium: false});
}
catch(err) {
  res.status(500).send("Server Error "+err.message); 
}
});

module.exports = paymentRouter;
