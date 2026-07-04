const asyncHandler = require('express-async-handler');
const Charity = require('../models/Charity');
const Donation = require('../models/Donation');
const User = require('../models/User');

// @route  GET /api/charities  (public, supports ?search=&category=)
const listCharities = asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const charities = await Charity.find(filter).sort({ isFeatured: -1, name: 1 });
  res.json({ charities });
});

// @route  GET /api/charities/featured
const getFeatured = asyncHandler(async (req, res) => {
  const charities = await Charity.find({ isActive: true, isFeatured: true });
  res.json({ charities });
});

// @route  GET /api/charities/:slug
const getCharityBySlug = asyncHandler(async (req, res) => {
  const charity = await Charity.findOne({ slug: req.params.slug, isActive: true });
  if (!charity) {
    res.status(404);
    throw new Error('Charity not found');
  }
  res.json({ charity });
});

// @route  PUT /api/charities/me/selection  (subscriber selects charity + contribution %)
const setMyCharitySelection = asyncHandler(async (req, res) => {
  const { charityId, contributionPercent } = req.body;
  const minPercent = Number(process.env.MIN_CHARITY_PERCENT || 10);

  const charity = await Charity.findOne({ _id: charityId, isActive: true });
  if (!charity) {
    res.status(404);
    throw new Error('Charity not found');
  }

  const percent = contributionPercent !== undefined ? Number(contributionPercent) : minPercent;
  if (percent < minPercent || percent > 100) {
    res.status(400);
    throw new Error(`Contribution percent must be between ${minPercent} and 100`);
  }

  req.user.selectedCharity = charity._id;
  req.user.charityContributionPercent = percent;
  await req.user.save();

  res.json({
    selectedCharity: charity._id,
    charityContributionPercent: percent,
  });
});

// @route  POST /api/charities/:id/donate  (independent donation, not tied to gameplay)
const donateIndependently = asyncHandler(async (req, res) => {
  const { amount, stripePaymentIntentId } = req.body;
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('A positive donation amount is required');
  }

  const charity = await Charity.findOne({ _id: req.params.id, isActive: true });
  if (!charity) {
    res.status(404);
    throw new Error('Charity not found');
  }

  const donation = await Donation.create({
    user: req.user._id,
    charity: charity._id,
    amount,
    source: 'independent',
    stripePaymentIntentId,
  });

  charity.totalRaised += amount;
  await charity.save();

  res.status(201).json({ donation });
});

module.exports = {
  listCharities,
  getFeatured,
  getCharityBySlug,
  setMyCharitySelection,
  donateIndependently,
};
