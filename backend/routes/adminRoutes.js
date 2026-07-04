const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');

const {
  listUsers,
  getUser,
  updateUser,
  editUserScore,
  createCharity,
  updateCharity,
  deleteCharity,
  getOverviewReport,
} = require('../controllers/adminController');

const { simulateDraw, publishDraw } = require('../controllers/drawController');
const { listWinners, verifyWinner, markPaid } = require('../controllers/winnerController');

const router = express.Router();

router.use(protect, adminOnly);

// Users
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/scores/:scoreId', editUserScore);

// Charities
router.post('/charities', createCharity);
router.put('/charities/:id', updateCharity);
router.delete('/charities/:id', deleteCharity);

// Draws
router.post('/draws/simulate', simulateDraw);
router.post('/draws/:id/publish', publishDraw);

// Winners
router.get('/winners', listWinners);
router.put('/winners/:id/verify', verifyWinner);
router.put('/winners/:id/pay', markPaid);

// Reports
router.get('/reports/overview', getOverviewReport);

module.exports = router;
