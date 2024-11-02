// backend/index.js
const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const equitySplitRoutes = require('./routes/equitySplitRoutes');
const projectionRoutes = require('./routes/projectionRoutes');
const taskRoutes = require('./routes/taskRoutes');
const taskCategoryRoutes = require('./routes/taskCategoryRoutes');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Basic Route
app.get('/', (req, res) => res.send('API is running...'));

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/expenses', require('./routes/expenseRoutes'));
app.use('/categories', require('./routes/categoryRoutes'));
app.use('/projection', projectionRoutes);
app.use('/users', userRoutes);
app.use('/api', equitySplitRoutes);
app.use('/tasks', taskRoutes); // Task routes
app.use('/task-categories', taskCategoryRoutes); // Task category routes

// Port setup
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
