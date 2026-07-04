const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const validator = require('validator');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  subscriptionStatus: user.subscriptionStatus,
  subscriptionPlan: user.subscriptionPlan,
  selectedCharity: user.selectedCharity,
  charityContributionPercent: user.charityContributionPercent,
});

// @route  POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }
  if (!validator.isEmail(email)) {
    res.status(400);
    throw new Error('Invalid email address');
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  res.status(201).json({ token, user: sanitizeUser(user) });
});

// @route  POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id);
  res.json({ token, user: sanitizeUser(user) });
});

// @route  GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

module.exports = { signup, login, getMe, sanitizeUser };
