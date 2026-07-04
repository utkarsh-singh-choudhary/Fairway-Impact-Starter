const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema(
  {
    draw: { type: mongoose.Schema.Types.ObjectId, ref: 'Draw', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    matchType: { type: String, enum: ['5-match', '4-match', '3-match'], required: true },
    matchedNumbers: { type: [Number], required: true },

    prizeAmount: { type: Number, required: true }, // split equally among tier winners, set after tier count known

    verification: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      proofUrl: { type: String }, // uploaded screenshot of scores
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },
      rejectionReason: { type: String },
    },

    payment: {
      status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
      paidAt: { type: Date },
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Winner', winnerSchema);
