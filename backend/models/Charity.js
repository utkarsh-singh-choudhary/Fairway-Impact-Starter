const mongoose = require('mongoose');

const charitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    logoUrl: { type: String },
    images: [{ type: String }],
    category: { type: String, trim: true },
    upcomingEvents: [
      {
        title: String,
        date: Date,
        location: String,
        description: String,
      },
    ],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    totalRaised: { type: Number, default: 0 }, // running total in smallest currency unit
  },
  { timestamps: true }
);

module.exports = mongoose.model('Charity', charitySchema);
