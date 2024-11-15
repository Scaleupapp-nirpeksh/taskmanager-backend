// Dev backend/index.js

const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();
const cors = require('cors');
const cron = require('node-cron');
const userRoutes = require('./routes/userRoutes');
const equitySplitRoutes = require('./routes/equitySplitRoutes');
const projectionRoutes = require('./routes/projectionRoutes');
const taskRoutes = require('./routes/taskRoutes');
const taskCategoryRoutes = require('./routes/taskCategoryRoutes');
const { notifyDueTasks, notifyOverdueTasks } = require('./services/whatsappNotification');
const User = require('./models/User');
const Task = require('./models/Task');
const documentRoutes = require('./routes/documentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();



// Simplified CORS configuration for local testing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// Connect to MongoDB
connectDB();

// Basic Route
app.get('/', (req, res) => res.send('API is running...'));

// Test route for due task notifications
app.get('/test-notify-due-tasks', async (req, res) => {
  try {
    await notifyDueTasks();
    res.send('Due tasks notification sent!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending due tasks notification');
  }
});

// Test route for overdue task notifications
app.get('/test-notify-overdue-tasks', async (req, res) => {
  try {
    await notifyOverdueTasks();
    res.send('Overdue tasks notification sent!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending overdue tasks notification');
  }
});


// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/expenses', require('./routes/expenseRoutes'));
app.use('/categories', require('./routes/categoryRoutes'));
app.use('/projection', projectionRoutes);
app.use('/users', userRoutes);
app.use('/api', equitySplitRoutes);
app.use('/tasks', taskRoutes);
app.use('/task-categories', taskCategoryRoutes);
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/documents', documentRoutes);
app.use('/upload', uploadRoutes);


// Start HTTP server for local testing
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

