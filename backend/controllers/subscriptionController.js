const asyncHandler = require('express-async-handler');
const Stripe = require('stripe');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
};

// @route  POST /api/subscriptions/checkout   { plan: 'monthly'|'yearly' }
const createCheckoutSession = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!['monthly', 'yearly'].includes(plan)) {
    res.status(400);
    throw new Error('plan must be "monthly" or "yearly"');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: req.user.email,
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${process.env.CLIENT_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.CLIENT_URL}/subscribe?checkout=cancelled`,
    metadata: { userId: req.user._id.toString(), plan },
  });

  res.json({ url: session.url });
});

// @route  POST /api/subscriptions/webhook   (raw body, Stripe signature verified)
const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const plan = session.metadata.plan;

      const stripeSub = await stripe.subscriptions.retrieve(session.subscription);

      const subscription = await Subscription.create({
        user: userId,
        plan,
        status: 'active',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: stripeSub.id,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        amount: stripeSub.items.data[0].price.unit_amount,
        currency: stripeSub.currency,
      });

      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'active',
        subscriptionPlan: plan,
        subscriptionRenewsAt: subscription.currentPeriodEnd,
      });
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const sub = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription });
      if (sub) {
        const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription);
        sub.status = 'active';
        sub.currentPeriodStart = new Date(stripeSub.current_period_start * 1000);
        sub.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
        await sub.save();
        await User.findByIdAndUpdate(sub.user, {
          subscriptionStatus: 'active',
          subscriptionRenewsAt: sub.currentPeriodEnd,
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const sub = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription });
      if (sub) {
        sub.status = 'past_due';
        await sub.save();
        await User.findByIdAndUpdate(sub.user, { subscriptionStatus: 'lapsed' });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object;
      const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
      if (sub) {
        sub.status = 'cancelled';
        await sub.save();
        await User.findByIdAndUpdate(sub.user, { subscriptionStatus: 'cancelled' });
      }
      break;
    }

    default:
      break; // unhandled event types are ignored
  }

  res.json({ received: true });
});

// @route  POST /api/subscriptions/cancel
const cancelSubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ user: req.user._id, status: 'active' }).sort({
    createdAt: -1,
  });
  if (!sub) {
    res.status(404);
    throw new Error('No active subscription found');
  }

  await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
  sub.cancelAtPeriodEnd = true;
  await sub.save();

  res.json({ message: 'Subscription will cancel at the end of the current billing period' });
});

// @route  GET /api/subscriptions/me
const getMySubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ subscription: sub });
});

module.exports = {
  createCheckoutSession,
  handleWebhook,
  cancelSubscription,
  getMySubscription,
};
