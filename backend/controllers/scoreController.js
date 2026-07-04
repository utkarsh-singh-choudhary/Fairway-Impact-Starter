const asyncHandler = require('express-async-handler');
const Score = require('../models/Score');
const { SCORE_MIN, SCORE_MAX } = require('../utils/drawEngine');

// @route  GET /api/scores
const getMyScores = asyncHandler(async (req, res) => {
  const scores = await Score.getLatestForUser(req.user._id);
  res.json({ scores });
});

// @route  POST /api/scores
const addScore = asyncHandler(async (req, res) => {
  const { value, date } = req.body;

  if (value === undefined || !date) {
    res.status(400);
    throw new Error('Score value and date are required');
  }
  if (value < SCORE_MIN || value > SCORE_MAX) {
    res.status(400);
    throw new Error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
  }

  try {
    const score = await Score.addScoreForUser(req.user._id, value, new Date(date));
    const scores = await Score.getLatestForUser(req.user._id);
    res.status(201).json({ score, scores });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('A score already exists for this date. Edit or delete it instead.');
    }
    throw err;
  }
});

// @route  PUT /api/scores/:id
const updateScore = asyncHandler(async (req, res) => {
  const { value, date } = req.body;
  const score = await Score.findOne({ _id: req.params.id, user: req.user._id });

  if (!score) {
    res.status(404);
    throw new Error('Score entry not found');
  }
  if (value !== undefined) {
    if (value < SCORE_MIN || value > SCORE_MAX) {
      res.status(400);
      throw new Error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
    }
    score.value = value;
  }
  if (date) score.date = new Date(date);

  try {
    await score.save();
    res.json({ score });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('Another score already exists for that date');
    }
    throw err;
  }
});

// @route  DELETE /api/scores/:id
const deleteScore = asyncHandler(async (req, res) => {
  const score = await Score.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!score) {
    res.status(404);
    throw new Error('Score entry not found');
  }
  res.json({ message: 'Score deleted' });
});

module.exports = { getMyScores, addScore, updateScore, deleteScore };
