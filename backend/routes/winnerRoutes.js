const express = require('express');
const multer = require('multer');
const { uploadProof } = require('../controllers/winnerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Memory storage (not disk) — Vercel's filesystem is ephemeral/read-only
// outside /tmp, so the file buffer is uploaded straight to Cloudinary in
// the controller instead of being saved locally.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/:id/proof', protect, upload.single('proof'), uploadProof);

module.exports = router;
