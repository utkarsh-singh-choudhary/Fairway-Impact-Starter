const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    charity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', required: true },
    amount: { type: Number, required: true }, // smallest currency unit
    source: { type: String, enum: ['subscription_share', 'independent'], required: true },
    stripePaymentIntentId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
