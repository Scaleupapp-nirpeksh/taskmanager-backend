// backend/index.js
const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();
const cors = require('cors');
const cron = require('node-cron'); // Add cron for scheduling jobs
const userRoutes = require('./routes/userRoutes');
const equitySplitRoutes = require('./routes/equitySplitRoutes');
const projectionRoutes = require('./routes/projectionRoutes');
const taskRoutes = require('./routes/taskRoutes');
const taskCategoryRoutes = require('./routes/taskCategoryRoutes');
const { notifyDueTasks, notifyOverdueTasks } = require('./services/whatsappNotification'); // Import notification functions
const User = require('./models/User'); // Import User model
const Task = require('./models/Task'); // Import Task model

const app = express();

// Middleware
const allowedOrigins = ['http://localhost:3000', 'https://nirpeksh.com'];
app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Connect to MongoDB
connectDB();

// Basic Route
app.get('/', (req, res) => res.send('API is running...'));

// Test Route for Due Tasks Notification
app.get('/test/notify-due-tasks', async (req, res) => {
    const users = await User.find();
    for (const user of users) {
      const today = new Date();
      const dueTasks = await Task.find({
        assignedTo: user._id,
        deadline: { $lte: new Date(today.setHours(23, 59, 59, 999)), $gte: new Date(today.setHours(0, 0, 0, 0)) },
        status: { $ne: 'Completed' },
      });
  
      if (dueTasks.length > 0) {
        await notifyDueTasks(user.phone_number, user.name, dueTasks); // Now passing user's name
      }
    }
    res.send('Due task notifications sent.');
});

// Test Route for Overdue Tasks Notification
app.get('/test/notify-overdue-tasks', async (req, res) => {
    const users = await User.find();
    for (const user of users) {
      const overdueTasks = await Task.find({
        assignedTo: user._id,
        deadline: { $lt: new Date() },
        status: { $ne: 'Completed' },
      });
  
      if (overdueTasks.length > 0) {
        await notifyOverdueTasks(user.phone_number, user.name, overdueTasks); // Now passing user's name
      }
    }
    res.send('Overdue task notifications sent.');
});

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/expenses', require('./routes/expenseRoutes'));
app.use('/categories', require('./routes/categoryRoutes'));
app.use('/projection', projectionRoutes);
app.use('/users', userRoutes);
app.use('/api', equitySplitRoutes);
app.use('/tasks', taskRoutes); // Task routes
app.use('/task-categories', taskCategoryRoutes); // Task category routes

// Schedule daily task reminders at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily task due notification job');

  try {
    const users = await User.find(); // Get all users
    for (const user of users) {
      const today = new Date();
      const dueTasks = await Task.find({
        assignedTo: user._id,
        deadline: { $lte: new Date(today.setHours(23, 59, 59, 999)), $gte: new Date(today.setHours(0, 0, 0, 0)) },
        status: { $ne: 'Completed' },
      });

      if (dueTasks.length > 0) {
        // Send WhatsApp notification with all tasks due today
        await notifyDueTasks(user.phone_number, user.name, dueTasks); // Pass the user's name
      }
    }
  } catch (error) {
    console.error('Error sending daily due notifications:', error);
  }
});

// Schedule overdue task notifications at 8 PM
cron.schedule('0 20 * * *', async () => {
  console.log('Running daily overdue task notification job');

  try {
    const users = await User.find(); // Get all users
    for (const user of users) {
      const overdueTasks = await Task.find({
        assignedTo: user._id,
        deadline: { $lt: new Date() },
        status: { $ne: 'Completed' },
      });

      if (overdueTasks.length > 0) {
        // Send WhatsApp notification with all overdue tasks
        await notifyOverdueTasks(user.phone_number, user.name, overdueTasks); // Pass the user's name
      }
    }
  } catch (error) {
    console.error('Error sending daily overdue notifications:', error);
  }
});

// Port setup
const PORT = process.env.PORT || 80;
//app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
