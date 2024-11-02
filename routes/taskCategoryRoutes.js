// backend/routes/taskCategoryRoutes.js
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { createCategory, getCategories } = require('../controllers/taskCategoryController');

const router = express.Router();

// Task category routes
router.post('/', protect, createCategory); // Create a new task category
router.get('/', protect, getCategories); // Get all categories

module.exports = router;
