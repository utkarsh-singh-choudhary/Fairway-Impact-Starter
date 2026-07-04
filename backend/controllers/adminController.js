const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Score = require('../models/Score');
const Charity = require('../models/Charity');
const Donation = require('../models/Donation');
const Draw = require('../models/Draw');
const Winner = require('../models/Winner');
const Subscription = require('../models/Subscription');

// ---------- USER MANAGEMENT ----------

// @route  GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const filter = {};
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  if (status) filter.subscriptionStatus = status;

  const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
  res.json({ users });
});

// @route  GET /api/admin/users/:id
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const scores = await Score.getLatestForUser(user._id);
  const subscription = await Subscription.findOne({ user: user._id }).sort({ createdAt: -1 });
  res.json({ user, scores, subscription });
});

// @route  PUT /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();
  res.json({ user });
});

// @route  PUT /api/admin/users/:id/scores/:scoreId  (admin edits a user's score)
const editUserScore = asyncHandler(async (req, res) => {
  const { value, date } = req.body;
  const score = await Score.findOne({ _id: req.params.scoreId, user: req.params.id });
  if (!score) {
    res.status(404);
    throw new Error('Score entry not found');
  }
  if (value !== undefined) score.value = value;
  if (date) score.date = new Date(date);
  await score.save();
  res.json({ score });
});

// ---------- CHARITY MANAGEMENT ----------

// @route  POST /api/admin/charities
const createCharity = asyncHandler(async (req, res) => {
  const { name, slug, description, logoUrl, images, category, isFeatured } = req.body;
  if (!name || !slug || !description) {
    res.status(400);
    throw new Error('name, slug, and description are required');
  }
  const charity = await Charity.create({ name, slug, description, logoUrl, images, category, isFeatured });
  res.status(201).json({ charity });
});

// @route  PUT /api/admin/charities/:id
const updateCharity = asyncHandler(async (req, res) => {
  const charity = await Charity.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!charity) {
    res.status(404);
    throw new Error('Charity not found');
  }
  res.json({ charity });
});

// @route  DELETE /api/admin/charities/:id
const deleteCharity = asyncHandler(async (req, res) => {
  const charity = await Charity.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!charity) {
    res.status(404);
    throw new Error('Charity not found');
  }
  res.json({ message: 'Charity deactivated' });
});

// ---------- REPORTS & ANALYTICS ----------

// @route  GET /api/admin/reports/overview
const getOverviewReport = asyncHandler(async (req, res) => {
  const [totalUsers, activeSubscribers, totalCharities, draws, winners] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ subscriptionStatus: 'active' }),
    Charity.countDocuments({ isActive: true }),
    Draw.find({ status: 'published' }),
    Winner.find({}),
  ]);

  const totalPrizePool = draws.reduce((sum, d) => sum + d.totalPool, 0);
  const totalPaidOut = winners
    .filter((w) => w.payment.status === 'paid')
    .reduce((sum, w) => sum + w.prizeAmount, 0);

  const charityDonations = await Donation.aggregate([
    { $group: { _id: '$charity', total: { $sum: '$amount' } } },
  ]);
  const totalCharityContributions = charityDonations.reduce((sum, c) => sum + c.total, 0);

  res.json({
    totalUsers,
    activeSubscribers,
    totalCharities,
    totalDrawsRun: draws.length,
    totalPrizePool,
    totalPaidOut,
    totalCharityContributions,
    charityBreakdown: charityDonations,
  });
});

module.exports = {
  listUsers,
  getUser,
  updateUser,
  editUserScore,
  createCharity,
  updateCharity,
  deleteCharity,
  getOverviewReport,
};
