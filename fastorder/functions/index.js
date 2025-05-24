const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")("sk_test_51Ql8mWK9RCqnKV4vy5a0hBJd1rY1ugKxDM1ZpeTOU8nzqN58l5z41odXx6jLsqrUrsZaRQaUsuT2hT1xR7zGb6Q800cwvFdkC3"); // ใส่ Stripe Secret Key ของคุณ

admin.initializeApp();
const db = admin.firestore();

const app = express();

// ตั้งค่า CORS - แก้ origin เป็น URL เว็บคุณเอง (หรือ * เพื่อทดสอบก่อน)
app.use(cors({ origin: "https://fastorder-8f143.web.app" }));

// สำหรับ parse json ปกติ (ไม่ใช้ raw เพราะใช้แค่ใน /webhook)
app.use(express.json());

// สร้าง Checkout Session
app.post("/createCheckoutSession", async (req, res) => {
  try {
    const { priceId, customerEmail } = req.body;

    if (!priceId || !customerEmail) {
      return res.status(400).json({ error: "Missing priceId or customerEmail" });
    }

    // สร้าง checkout session ของ Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      success_url: "https://fastorder-8f143.web.app/success",
      cancel_url: "https://fastorder-8f143.web.app/cancel",
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

// Raw body parser สำหรับ Stripe webhook
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = "whsec_rIcl0duErF1annCtuNt3QF8CwaP5NI4v"; // ใส่ webhook secret ของคุณ

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // เช็ค event type
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email;

    // อัพเดตข้อมูลผู้ใช้ใน Firestore
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

exports.api = functions.https.onRequest(app);
