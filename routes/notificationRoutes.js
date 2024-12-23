const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getNotifications, markAsRead } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
