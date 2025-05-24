const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");
const stripe = require("stripe")("sk_test_51Ql8mWK9RCqnKV4vy5a0hBJd1rY1ugKxDM1ZpeTOU8nzqN58l5z41odXx6jLsqrUrsZaRQaUsuT2hT1xR7zGb6Q800cwvFdkC3"); // ใช้ Stripe Secret Key ของคุณ

admin.initializeApp();
const db = admin.firestore();

const app = express();

// Raw body parser สำหรับ Stripe Webhook
app.use(
  bodyParser.raw({ type: "application/json" })
);

app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = "whsec_rIcl0duErF1annCtuNt3QF8CwaP5NI4v"; // เปลี่ยนเป็น Webhook Secret ของคุณ

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email;

    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        isPaid: true,
        package: "Pro",
        subscriptionCreatedAt: admin.firestore.Timestamp.now(),
        subscriptionEndsAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      });
    }
  }

  res.status(200).send("Webhook received");
});

// Export function
exports.handleStripeWebhook = functions.https.onRequest(app);
