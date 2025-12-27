const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
const Payment = require("../models/payment");
const User = require("../models/user");

module.exports = async function webhookHandler(req, res) {
  try {
    console.log("🔥 WEBHOOK HIT");

    const signature = req.headers["x-razorpay-signature"];

    const isValid = validateWebhookSignature(
      req.body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.log("❌ Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    if (req.body.event !== "payment.captured") {
      console.log("Ignoring event:", req.body.event);
      return res.status(200).send("Ignored");
    }

    const paymentDetails = req.body.payload.payment.entity;
    console.log("Payment:", paymentDetails.order_id);

    const payment = await Payment.findOne({
      orderId: paymentDetails.order_id,
    });

    if (!payment) {
      console.log("❌ Payment not found");
      return res.status(404).send("Payment not found");
    }

    payment.status = paymentDetails.status;
    await payment.save();

    await User.findByIdAndUpdate(payment.userId, {
      isPremium: true,
      memberShipType: paymentDetails.notes.membershipType,
    });

    console.log("✅ User upgraded to premium");
    res.status(200).send("Webhook processed");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Server Error");
  }
};
