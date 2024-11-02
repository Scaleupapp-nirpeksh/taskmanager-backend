// backend/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const { createCategory, getAllCategories } = require('../controllers/categoryController');

// POST /categories - Add a new category
router.post('/', createCategory);

// GET /categories - Retrieve all categories
router.get('/', getAllCategories);

module.exports = router;
