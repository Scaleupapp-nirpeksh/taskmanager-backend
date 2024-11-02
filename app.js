// backend/app.js
const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.get('/auth/test', (req, res) => res.send('Direct route test is working'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/expenses', require('./routes/expenseRoutes'));
app.use('/categories', require('./routes/categoryRoutes'));

app.get('/', (req, res) => res.send('API is running...'));

module.exports = app;
