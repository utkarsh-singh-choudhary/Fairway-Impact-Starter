const express = require('express');
const { listPublishedDraws, getMyParticipation } = require('../controllers/drawController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', listPublishedDraws);
router.get('/me/participation', protect, getMyParticipation);

module.exports = router;
