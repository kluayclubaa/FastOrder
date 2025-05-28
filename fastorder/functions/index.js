const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")("sk_test_51Ql8mWK9RCqnKV4vy5a0hBJd1rY1ugKxDM1ZpeTOU8nzqN58l5z41odXx6jLsqrUrsZaRQaUsuT2hT1xR7zGb6Q800cwvFdkC3"); 

admin.initializeApp();
const db = admin.firestore();


const app = express();


const corsOptions = {
  origin: [
    "https://fastorder-8f143.web.app",
    "https://fastorder-8f143.firebaseapp.com",
    "http://localhost:3000", 
    "http://localhost:3001"  
  ],
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "stripe-signature"
  ],
  credentials: true,
  optionsSuccessStatus: 200
};


app.use(cors(corsOptions));

// Handle preflight OPTIONS requests
app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin || 'https://fastorder-8f143.web.app');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, stripe-signature');
  res.set('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  next();
});


app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());


app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'FastOrder API'
  });
});


app.post('/createCheckoutSession', async (req, res) => {
  try {
    console.log('Creating checkout session with body:', req.body);
    
    const { priceId, customerEmail } = req.body;
    

    if (!priceId || !customerEmail) {
      console.error('Missing required fields:', { priceId: !!priceId, customerEmail: !!customerEmail });
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['priceId', 'customerEmail']
      });
    }

   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }


    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        }
      ],
      customer_email: customerEmail,
      success_url: 'https://fastorder-8f143.web.app/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://fastorder-8f143.web.app/pricing?canceled=true',
      metadata: {
        customerEmail: customerEmail,
        priceId: priceId
      },
      subscription_data: {
        metadata: {
          customerEmail: customerEmail
        }
      }
    });

    console.log('Checkout session created successfully:', session.id);
    
    res.status(200).json({ 
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message,
      type: error.type || 'unknown_error'
    });
  }
});


app.get('/subscription-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }


    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ 
        error: 'User not found',
        isPaid: false 
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    res.status(200).json({
      isPaid: userData.isPaid || false,
      package: userData.package || null,
      subscriptionCreatedAt: userData.subscriptionCreatedAt || null,
      subscriptionEndsAt: userData.subscriptionEndsAt || null
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ 
      error: 'Failed to get subscription status',
      message: error.message 
    });
  }
});


app.post('/cancel-subscription', async (req, res) => {
  try {
    const { customerEmail } = req.body;

    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required' });
    }


    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', customerEmail).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // If user has a Stripe subscription ID, cancel it
    if (userData.stripeSubscriptionId) {
      await stripe.subscriptions.update(userData.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
    }

    // Update user status in Firestore
    await userDoc.ref.update({
      isPaid: false,
      package: null,
      canceledAt: admin.firestore.Timestamp.now()
    });

    res.status(200).json({ 
      message: 'Subscription canceled successfully'
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      message: error.message 
    });
  }
});

// Stripe Webhook Handler
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'whsec_rIcl0duErF1annCtuNt3QF8CwaP5NI4v'; // Replace with your actual webhook secret
  
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('Webhook verified successfully:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook handler functions
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout.session.completed:', session.id);
  
  const customerEmail = session.customer_email || session.metadata?.customerEmail;
  
  if (!customerEmail) {
    console.error('No customer email found in session');
    return;
  }

  try {
    // Find user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', customerEmail).limit(1).get();

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      
      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = subscription.items.data[0].price.id;
      
      // Determine package type based on price ID
      let packageType = 'Pro';
      if (priceId === 'price_1RSDUUK9RCqnKV4vtv12xMm3') packageType = 'Free Trial';
      else if (priceId === 'price_1RSD2mK9RCqnKV4vir77dkWd') packageType = 'Monthly';
      else if (priceId === 'price_1RSD3GK9RCqnKV4vYqJju8GZ') packageType = 'Yearly';
      
      // Update user document
      await userDoc.ref.update({
        isPaid: true,
        package: packageType,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        subscriptionCreatedAt: admin.firestore.Timestamp.now(),
        subscriptionEndsAt: admin.firestore.Timestamp.fromDate(
          new Date(subscription.current_period_end * 1000)
        ),
        lastPaymentAt: admin.firestore.Timestamp.now()
      });
      
      console.log(`User ${customerEmail} subscription activated: ${packageType}`);
    } else {
      console.error(`User not found for email: ${customerEmail}`);
    }
  } catch (error) {
    console.error('Error updating user subscription:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log('Processing customer.subscription.created:', subscription.id);
  // Additional subscription creation logic if needed
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id);
  
  try {
    // Find user by Stripe subscription ID
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('stripeSubscriptionId', '==', subscription.id).limit(1).get();

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      
      await userDoc.ref.update({
        subscriptionEndsAt: admin.firestore.Timestamp.fromDate(
          new Date(subscription.current_period_end * 1000)
        ),
        subscriptionStatus: subscription.status
      });
      
      console.log(`Subscription updated for user: ${subscription.id}`);
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Processing customer.subscription.deleted:', subscription.id);
  
  try {
    // Find user by Stripe subscription ID
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('stripeSubscriptionId', '==', subscription.id).limit(1).get();

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      
      await userDoc.ref.update({
        isPaid: false,
        package: null,
        subscriptionStatus: 'canceled',
        canceledAt: admin.firestore.Timestamp.now()
      });
      
      console.log(`Subscription canceled for user: ${subscription.id}`);
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
  }
}

async function handlePaymentSucceeded(invoice) {
  console.log('ประมวลผล invoice.payment_succeeded:', invoice.id);
  
  try {
    // ดึงข้อมูล subscription จาก Stripe
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    
    // ดึงข้อมูลลูกค้าจาก Stripe (สำคัญมาก!)
    const customer = await stripe.customers.retrieve(invoice.customer);
    
    console.log('Customer email:', customer.email);
    
    // หาผู้ใช้ในฐานข้อมูลจาก email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', customer.email).limit(1).get();

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      
      // อัปเดตสถานะผู้ใช้
      await userDoc.ref.update({
        lastPaymentAt: admin.firestore.Timestamp.now(),
        subscriptionEndsAt: admin.firestore.Timestamp.fromDate(
          new Date(subscription.current_period_end * 1000)
        ),
        isPaid: true,               // ตั้งเป็น true เมื่อชำระเงินสำเร็จ
        subscriptionStatus: 'active' // ตั้งสถานะเป็น active
      });
      
      console.log(`ชำระเงินสำเร็จสำหรับ subscription: ${subscription.id}, อีเมลผู้ใช้: ${customer.email}`);
    } else {
      console.error(`ไม่พบผู้ใช้สำหรับอีเมล: ${customer.email}`);
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการประมวลผลการชำระเงิน:', error);
  }
}

async function handlePaymentFailed(invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);
  
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    
    // Find user by Stripe subscription ID
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('stripeSubscriptionId', '==', subscription.id).limit(1).get();

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      
      await userDoc.ref.update({
        paymentFailedAt: admin.firestore.Timestamp.now(),
        subscriptionStatus: 'past_due'
      });
      
      console.log(`Payment failed for subscription: ${subscription.id}`);
    }
  } catch (error) {
    console.error('Error processing payment failure:', error);
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method 
  });
});

// Export the function
exports.api = functions.https.onRequest(app);