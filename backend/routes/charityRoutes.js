const express = require('express');
const {
  listCharities,
  getFeatured,
  getCharityBySlug,
  setMyCharitySelection,
  donateIndependently,
} = require('../controllers/charityController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', listCharities);
router.get('/featured', getFeatured);
router.get('/:slug', getCharityBySlug);

router.put('/me/selection', protect, setMyCharitySelection);
router.post('/:id/donate', protect, donateIndependently);

module.exports = router;
