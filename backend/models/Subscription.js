const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, enum: ['monthly', 'yearly'], required: true },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'lapsed', 'past_due'],
      default: 'active',
    },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    amount: { type: Number, required: true }, // in smallest currency unit (e.g. cents)
    currency: { type: String, default: 'usd' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
