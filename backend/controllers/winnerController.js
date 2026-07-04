const asyncHandler = require('express-async-handler');
const Winner = require('../models/Winner');
const { uploadBufferToCloudinary } = require('../config/cloudinary');

// @route  POST /api/winners/:id/proof   (subscriber uploads screenshot proof)
const uploadProof = asyncHandler(async (req, res) => {
  const winner = await Winner.findOne({ _id: req.params.id, user: req.user._id });
  if (!winner) {
    res.status(404);
    throw new Error('Winner record not found');
  }
  if (!req.file && !req.body.proofUrl) {
    res.status(400);
    throw new Error('Proof file or proofUrl is required');
  }

  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer);
    winner.verification.proofUrl = result.secure_url;
  } else {
    winner.verification.proofUrl = req.body.proofUrl;
  }
  winner.verification.status = 'pending';
  await winner.save();

  res.json({ winner });
});

// @route  GET /api/admin/winners  (?status=pending)
const listWinners = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter['verification.status'] = status;

  const winners = await Winner.find(filter)
    .populate('user', 'name email')
    .populate('draw', 'month')
    .sort({ createdAt: -1 });

  res.json({ winners });
});

// @route  PUT /api/admin/winners/:id/verify   { decision: 'approved'|'rejected', reason? }
const verifyWinner = asyncHandler(async (req, res) => {
  const { decision, reason } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    res.status(400);
    throw new Error('decision must be "approved" or "rejected"');
  }

  const winner = await Winner.findById(req.params.id);
  if (!winner) {
    res.status(404);
    throw new Error('Winner record not found');
  }

  winner.verification.status = decision;
  winner.verification.reviewedBy = req.user._id;
  winner.verification.reviewedAt = new Date();
  if (decision === 'rejected') winner.verification.rejectionReason = reason || 'Not specified';

  await winner.save();
  res.json({ winner });
});

// @route  PUT /api/admin/winners/:id/pay
const markPaid = asyncHandler(async (req, res) => {
  const winner = await Winner.findById(req.params.id);
  if (!winner) {
    res.status(404);
    throw new Error('Winner record not found');
  }
  if (winner.verification.status !== 'approved') {
    res.status(400);
    throw new Error('Winner must be approved before payout');
  }

  winner.payment.status = 'paid';
  winner.payment.paidAt = new Date();
  winner.payment.paidBy = req.user._id;
  await winner.save();

  res.json({ winner });
});

module.exports = { uploadProof, listWinners, verifyWinner, markPaid };
