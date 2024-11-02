// backend/routes/userRoutes.js
const express = require('express');
const User = require('../models/User');
const router = express.Router();

// GET /users - Retrieve all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'name'); // Fetch only the 'name' field
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
