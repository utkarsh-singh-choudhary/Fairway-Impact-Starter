const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

/**
 * Vercel Cron Jobs make a GET request to this route on the schedule defined
 * in vercel.json. Protect it with a shared secret so it can't be triggered
 * by anyone who finds the URL — Vercel automatically sends this header
 * when CRON_SECRET is set as an env var on the project.
 */
const verifyCronSecret = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// @route  GET /api/cron/simulate-monthly-draw
// Runs on the 1st of each month (see vercel.json). This only SIMULATES —
// an admin still reviews and publishes manually via the admin dashboard,
// matching the PRD's "simulation before official publish" requirement.
router.get(
  '/simulate-monthly-draw',
  verifyCronSecret,
  asyncHandler(async (req, res) => {
    const Draw = require('../models/Draw');
    const { generateRandomNumbers, calculatePoolBreakdown, getActiveSubscriberCount } = require('../utils/drawEngine');

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const existing = await Draw.findOne({ month });
    if (existing) {
      return res.json({ message: `Draw for ${month} already exists, skipping`, draw: existing });
    }

    const winningNumbers = generateRandomNumbers();
    const activeSubscriberCount = await getActiveSubscriberCount();
    const CONTRIBUTION_PER_SUBSCRIBER = 500;
    const totalPool = activeSubscriberCount * CONTRIBUTION_PER_SUBSCRIBER;
    const poolBreakdown = calculatePoolBreakdown(totalPool);

    const draw = await Draw.create({
      month,
      logicType: 'random',
      winningNumbers,
      status: 'simulated',
      totalPool,
      poolBreakdown,
      activeSubscriberCountAtDraw: activeSubscriberCount,
      simulatedAt: new Date(),
    });

    res.json({ message: 'Monthly draw auto-simulated, awaiting admin publish', draw });
  })
);

module.exports = router;
