// backend/routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const router = express.Router();

// POST /auth/register - Register a new user
router.post('/register', registerUser);

// POST /auth/login - Login user
router.post('/login', loginUser);

console.log('Auth routes file loaded');
// Test route to verify registration
router.get('/test', (req, res) => res.send('Auth route is working'));


module.exports = router;
