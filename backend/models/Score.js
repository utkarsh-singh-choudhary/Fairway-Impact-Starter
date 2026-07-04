const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    value: { type: Number, required: true, min: 1, max: 45 }, // Stableford points
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

// Enforce one score per date per user at the DB level
scoreSchema.index({ user: 1, date: 1 }, { unique: true });

/**
 * Adds a new score for a user, enforcing:
 * - one score per date (throws if duplicate; caller should catch E11000)
 * - only the latest 5 scores are retained (oldest is deleted when a 6th is added)
 */
scoreSchema.statics.addScoreForUser = async function (userId, value, date) {
  const created = await this.create({ user: userId, value, date });

  const allScores = await this.find({ user: userId }).sort({ date: -1 });
  if (allScores.length > 5) {
    const toRemove = allScores.slice(5); // everything beyond the latest 5
    await this.deleteMany({ _id: { $in: toRemove.map((s) => s._id) } });
  }

  return created;
};

scoreSchema.statics.getLatestForUser = function (userId) {
  return this.find({ user: userId }).sort({ date: -1 }).limit(5);
};

module.exports = mongoose.model('Score', scoreSchema);
