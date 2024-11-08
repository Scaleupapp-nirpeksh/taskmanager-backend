// backend/routes/dashboardRoutes.js
const express = require('express');
const { getUserDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getUserDashboard);

module.exports = router;