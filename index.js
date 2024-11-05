// backend/index.js
const http = require('http');
const https = require('https');
const fs = require('fs');
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

// Load SSL certificates
const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/nirpekshnandan.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/nirpekshnandan.com/fullchain.pem')
};

const HTTPS_PORT = 3001;
const HTTP_PORT = 3000;

// Allow all origins in CORS
const allowedOrigins = [
  'https://nirpeksh.com',
  'https://nirpekshnandan.com',
  'https://master.dri5c16mhxrkg.amplifyapp.com',
  'https://prod.d13hd8ekmv548z.amplifyapp.com',
  'https://master.dp6erxymzofdg.amplifyapp.com',
];
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

      if (Array.isArray(dueTasks) && dueTasks.length > 0) {
        await notifyDueTasks(user.phone_number, dueTasks);
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

      if (Array.isArray(overdueTasks) && overdueTasks.length > 0) {
        await notifyOverdueTasks(user.phone_number, overdueTasks);
      }
    }
  } catch (error) {
    console.error('Error sending daily overdue notifications:', error);
  }
});

// Start HTTPS server
https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
  console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
});

// Optional: Start an HTTP server to redirect traffic to HTTPS
http.createServer((req, res) => {
  res.writeHead(301, { "Location": `https://${req.headers.host}${req.url}` });
  res.end();
}).listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on port ${HTTP_PORT} and redirecting to HTTPS`);
});
