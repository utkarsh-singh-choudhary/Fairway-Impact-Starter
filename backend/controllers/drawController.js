const asyncHandler = require('express-async-handler');
const Draw = require('../models/Draw');
const Score = require('../models/Score');
const User = require('../models/User');
const Winner = require('../models/Winner');
const {
  generateRandomNumbers,
  generateAlgorithmicNumbers,
  calculatePoolBreakdown,
  getActiveSubscriberCount,
  determineMatchTier,
} = require('../utils/drawEngine');

// Assumes a fixed per-subscriber pool contribution rate; in production this
// should be derived from actual Subscription revenue for the period.
const CONTRIBUTION_PER_SUBSCRIBER = 500; // e.g. $5.00 in cents, illustrative

async function buildDrawPreview(month, logicType, algorithmicMode) {
  const winningNumbers =
    logicType === 'algorithmic'
      ? await generateAlgorithmicNumbers(algorithmicMode)
      : generateRandomNumbers();

  const activeSubscriberCount = await getActiveSubscriberCount();
  const totalPool = activeSubscriberCount * CONTRIBUTION_PER_SUBSCRIBER;
  const poolBreakdown = calculatePoolBreakdown(totalPool);

  return { winningNumbers, activeSubscriberCount, totalPool, poolBreakdown };
}

// @route  POST /api/admin/draws/simulate   { month, logicType, algorithmicMode }
const simulateDraw = asyncHandler(async (req, res) => {
  const { month, logicType, algorithmicMode } = req.body;
  if (!month || !logicType) {
    res.status(400);
    throw new Error('month and logicType are required');
  }

  const preview = await buildDrawPreview(month, logicType, algorithmicMode);

  let draw = await Draw.findOne({ month });
  if (draw && draw.status === 'published') {
    res.status(409);
    throw new Error('This month has already been published and cannot be re-simulated');
  }

  const previousMonthDraw = await Draw.findOne({ status: 'published' }).sort({ month: -1 });
  const rolledOverJackpot = previousMonthDraw?.jackpotRolledOverToNextMonth || 0;

  const payload = {
    month,
    logicType,
    winningNumbers: preview.winningNumbers,
    status: 'simulated',
    totalPool: preview.totalPool + rolledOverJackpot,
    poolBreakdown: {
      fiveMatch: preview.poolBreakdown.fiveMatch + rolledOverJackpot,
      fourMatch: preview.poolBreakdown.fourMatch,
      threeMatch: preview.poolBreakdown.threeMatch,
    },
    jackpotRolledOverFromPreviousMonth: rolledOverJackpot,
    activeSubscriberCountAtDraw: preview.activeSubscriberCount,
    simulatedAt: new Date(),
  };

  if (draw) {
    Object.assign(draw, payload);
  } else {
    draw = new Draw(payload);
  }
  await draw.save();

  res.json({ draw, message: 'Simulation complete. Review before publishing.' });
});

// @route  POST /api/admin/draws/:id/publish
const publishDraw = asyncHandler(async (req, res) => {
  const draw = await Draw.findById(req.params.id);
  if (!draw) {
    res.status(404);
    throw new Error('Draw not found');
  }
  if (draw.status === 'published') {
    res.status(409);
    throw new Error('Draw already published');
  }

  // Evaluate every active subscriber's latest 5 scores against winning numbers
  const activeUsers = await User.find({ subscriptionStatus: 'active' });
  const tierResults = { '5-match': [], '4-match': [], '3-match': [] };

  for (const user of activeUsers) {
    const scores = await Score.getLatestForUser(user._id);
    if (scores.length === 0) continue;
    const result = determineMatchTier(
      scores.map((s) => s.value),
      draw.winningNumbers
    );
    if (result) tierResults[result.tier].push({ user, matched: result.matched });
  }

  const winnersToCreate = [];
  const tierPoolMap = {
    '5-match': draw.poolBreakdown.fiveMatch,
    '4-match': draw.poolBreakdown.fourMatch,
    '3-match': draw.poolBreakdown.threeMatch,
  };

  for (const tier of Object.keys(tierResults)) {
    const winnersInTier = tierResults[tier];
    if (winnersInTier.length === 0) continue;
    const splitAmount = Math.floor(tierPoolMap[tier] / winnersInTier.length);
    winnersInTier.forEach(({ user, matched }) => {
      winnersToCreate.push({
        draw: draw._id,
        user: user._id,
        matchType: tier,
        matchedNumbers: matched,
        prizeAmount: splitAmount,
      });
    });
  }

  // Jackpot rollover: no 5-match winners means the 5-match pool carries forward
  draw.jackpotRolledOverToNextMonth =
    tierResults['5-match'].length === 0 ? tierPoolMap['5-match'] : 0;

  if (winnersToCreate.length > 0) {
    await Winner.insertMany(winnersToCreate);
  }

  draw.status = 'published';
  draw.publishedAt = new Date();
  draw.publishedBy = req.user._id;
  await draw.save();

  res.json({
    draw,
    winnersCreated: winnersToCreate.length,
    breakdown: {
      fiveMatchWinners: tierResults['5-match'].length,
      fourMatchWinners: tierResults['4-match'].length,
      threeMatchWinners: tierResults['3-match'].length,
    },
  });
});

// @route  GET /api/draws  (public/subscriber view of published draws)
const listPublishedDraws = asyncHandler(async (req, res) => {
  const draws = await Draw.find({ status: 'published' }).sort({ month: -1 });
  res.json({ draws });
});

// @route  GET /api/draws/me/participation
const getMyParticipation = asyncHandler(async (req, res) => {
  const winners = await Winner.find({ user: req.user._id }).populate('draw', 'month winningNumbers');
  const publishedDraws = await Draw.find({ status: 'published' }).select('month');
  res.json({
    drawsEntered: publishedDraws.length,
    winnings: winners,
  });
});

module.exports = {
  simulateDraw,
  publishDraw,
  listPublishedDraws,
  getMyParticipation,
};
