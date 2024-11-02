const express = require('express');
const { saveEquitySplit, getEquitySplit } = require('../controllers/equitySplitController');
//const { authMiddleware } = require('../middlewares/authMiddleware'); // Assumes auth middleware is available
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// POST /equity-split - Save or update the equity split
router.post('/equity-split', protect, saveEquitySplit);

// GET /equity-split - Get the equity split for the logged-in user
router.get('/equity-split', protect, getEquitySplit);


module.exports = router;
