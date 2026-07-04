const mongoose = require('mongoose');

const drawSchema = new mongoose.Schema(
  {
    month: { type: String, required: true, unique: true }, // e.g. "2026-07"
    logicType: { type: String, enum: ['random', 'algorithmic'], required: true },
    winningNumbers: { type: [Number], required: true }, // 5 numbers drawn from Stableford-range pool

    status: {
      type: String,
      enum: ['pending', 'simulated', 'published'],
      default: 'pending',
    },

    // Prize pool snapshot at time of draw
    totalPool: { type: Number, required: true },
    poolBreakdown: {
      fiveMatch: { type: Number, required: true },
      fourMatch: { type: Number, required: true },
      threeMatch: { type: Number, required: true },
    },

    // Jackpot rollover tracking
    jackpotRolledOverFromPreviousMonth: { type: Number, default: 0 },
    jackpotRolledOverToNextMonth: { type: Number, default: 0 },

    simulatedAt: { type: Date },
    publishedAt: { type: Date },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    activeSubscriberCountAtDraw: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Draw', drawSchema);
