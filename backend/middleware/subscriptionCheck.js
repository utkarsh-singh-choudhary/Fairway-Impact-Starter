const asyncHandler = require('express-async-handler');
const Subscription = require('../models/Subscription');

/**
 * Real-time subscription validation, run on every authenticated request
 * that touches a gated feature (score entry, draw participation, etc).
 * Syncs the cached status on User if it has drifted (e.g. period elapsed
 * but webhook hasn't fired yet).
 */
const requireActiveSubscription = asyncHandler(async (req, res, next) => {
  const user = req.user;

  const sub = await Subscription.findOne({ user: user._id }).sort({ createdAt: -1 });

  const now = new Date();
  let effectiveStatus = 'none';

  if (sub) {
    if (sub.status === 'active' && sub.currentPeriodEnd > now) {
      effectiveStatus = 'active';
    } else if (sub.status === 'cancelled' && sub.currentPeriodEnd > now) {
      // Cancelled but still within paid period
      effectiveStatus = 'active';
    } else {
      effectiveStatus = 'lapsed';
    }
  }

  if (user.subscriptionStatus !== effectiveStatus) {
    user.subscriptionStatus = effectiveStatus;
    await user.save();
  }

  if (effectiveStatus !== 'active') {
    res.status(402);
    throw new Error('An active subscription is required to access this feature');
  }

  next();
});

module.exports = { requireActiveSubscription };
