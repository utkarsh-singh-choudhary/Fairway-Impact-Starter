const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['subscriber', 'admin'], default: 'subscriber' },

    // Subscription snapshot (source of truth is Subscription model; this is a fast-access cache)
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'lapsed', 'cancelled'],
      default: 'none',
    },
    subscriptionPlan: { type: String, enum: ['monthly', 'yearly', null], default: null },
    subscriptionRenewsAt: { type: Date, default: null },

    // Charity selection
    selectedCharity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', default: null },
    charityContributionPercent: { type: Number, default: 10, min: 10, max: 100 },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Helper used across the app to gate feature access
userSchema.methods.hasActiveAccess = function () {
  return this.subscriptionStatus === 'active';
};

module.exports = mongoose.model('User', userSchema);
