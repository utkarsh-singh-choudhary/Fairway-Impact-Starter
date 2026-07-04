const Score = require('../models/Score');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

const SCORE_MIN = 1;
const SCORE_MAX = 45;
const NUMBERS_PER_DRAW = 5;

/**
 * Standard lottery-style draw: 5 unique numbers in the Stableford score range.
 */
function generateRandomNumbers() {
  const numbers = new Set();
  while (numbers.size < NUMBERS_PER_DRAW) {
    numbers.add(Math.floor(Math.random() * (SCORE_MAX - SCORE_MIN + 1)) + SCORE_MIN);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Algorithmic draw: weighted by frequency of scores actually submitted by users
 * this cycle. "mode" can bias toward most-frequent or least-frequent values,
 * per PRD 06 (algorithmic option).
 */
async function generateAlgorithmicNumbers(mode = 'most_frequent') {
  const allScores = await Score.find({}, 'value');
  const frequency = new Map();
  for (let v = SCORE_MIN; v <= SCORE_MAX; v++) frequency.set(v, 0);
  allScores.forEach((s) => frequency.set(s.value, (frequency.get(s.value) || 0) + 1));

  // Build a weighted pool: value repeated proportional to its frequency (or inverse for least_frequent)
  const weighted = [];
  const maxFreq = Math.max(...frequency.values(), 1);

  frequency.forEach((count, value) => {
    const weight =
      mode === 'least_frequent' ? maxFreq - count + 1 : count + 1; // +1 so every value has a chance
    for (let i = 0; i < weight; i++) weighted.push(value);
  });

  const numbers = new Set();
  let guard = 0;
  while (numbers.size < NUMBERS_PER_DRAW && guard < 10000) {
    const pick = weighted[Math.floor(Math.random() * weighted.length)];
    numbers.add(pick);
    guard++;
  }
  // Fallback in the unlikely event the weighted pool can't fill 5 unique numbers
  while (numbers.size < NUMBERS_PER_DRAW) {
    numbers.add(Math.floor(Math.random() * (SCORE_MAX - SCORE_MIN + 1)) + SCORE_MIN);
  }

  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Computes total prize pool from active subscriber count and per-subscription
 * contribution rate, then splits by PRD 07 tier percentages.
 */
function calculatePoolBreakdown(totalPool) {
  const fiveShare = Number(process.env.POOL_SHARE_5MATCH || 40) / 100;
  const fourShare = Number(process.env.POOL_SHARE_4MATCH || 35) / 100;
  const threeShare = Number(process.env.POOL_SHARE_3MATCH || 25) / 100;

  return {
    fiveMatch: Math.round(totalPool * fiveShare),
    fourMatch: Math.round(totalPool * fourShare),
    threeMatch: Math.round(totalPool * threeShare),
  };
}

async function getActiveSubscriberCount() {
  return User.countDocuments({ subscriptionStatus: 'active' });
}

/**
 * Compares a user's latest 5 scores against winning numbers and determines
 * the highest match tier achieved (5, 4, or 3 matching values; below 3 = no win).
 * "Match" = the user's score set contains the winning number (order-independent).
 */
function determineMatchTier(userScoreValues, winningNumbers) {
  const userSet = new Set(userScoreValues);
  const matched = winningNumbers.filter((n) => userSet.has(n));

  if (matched.length >= 5) return { tier: '5-match', matched };
  if (matched.length === 4) return { tier: '4-match', matched };
  if (matched.length === 3) return { tier: '3-match', matched };
  return null; // no win
}

module.exports = {
  SCORE_MIN,
  SCORE_MAX,
  NUMBERS_PER_DRAW,
  generateRandomNumbers,
  generateAlgorithmicNumbers,
  calculatePoolBreakdown,
  getActiveSubscriberCount,
  determineMatchTier,
};
