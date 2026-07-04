const express = require('express');
const {
  createCheckoutSession,
  cancelSubscription,
  getMySubscription,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// NOTE: the raw webhook route is mounted separately in server.js (needs raw body)
router.post('/checkout', protect, createCheckoutSession);
router.post('/cancel', protect, cancelSubscription);
router.get('/me', protect, getMySubscription);

module.exports = router;
