const express = require('express');
const { getMyScores, addScore, updateScore, deleteScore } = require('../controllers/scoreController');
const { protect } = require('../middleware/auth');
const { requireActiveSubscription } = require('../middleware/subscriptionCheck');

const router = express.Router();

router.use(protect, requireActiveSubscription);

router.get('/', getMyScores);
router.post('/', addScore);
router.put('/:id', updateScore);
router.delete('/:id', deleteScore);

module.exports = router;
