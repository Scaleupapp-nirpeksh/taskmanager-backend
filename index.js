// backend/index.js

const http = require('http');
const https = require('https');
const fs = require('fs');
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

const app = express();

// Load SSL certificates
const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/nirpekshnandan.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/nirpekshnandan.com/fullchain.pem')
};

const HTTPS_PORT = 443;
const HTTP_PORT = 3001;

// Define allowed origins
const allowedOrigins = [
  'https://nirpeksh.com',
  'https://nirpekshnandan.com',
  'https://master.dri5c16mhxrkg.amplifyapp.com',
  'https://prod.d13hd8ekmv548z.amplifyapp.com',
  'https://master.dp6erxymzofdg.amplifyapp.com',
  'https://master.d2rgoocsk44jed.amplifyapp.com'
];

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Handle preflight OPTIONS requests globally
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.writeHead(200);
  res.end();
});

app.use(express.json());

// Connect to MongoDB
connectDB();

// Basic Route
app.get('/', (req, res) => res.send('API is running...'));

// Test Routes for Notifications
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
      await notifyDueTasks(user.phone_number, user.name, dueTasks);
    }
  }
  res.send('Due task notifications sent.');
});

app.get('/test/notify-overdue-tasks', async (req, res) => {
  const users = await User.find();
  for (const user of users) {
    const overdueTasks = await Task.find({
      assignedTo: user._id,
      deadline: { $lt: new Date() },
      status: { $ne: 'Completed' },
    });

    if (overdueTasks.length > 0) {
      await notifyOverdueTasks(user.phone_number, user.name, overdueTasks);
    }
  }
  res.send('Overdue task notifications sent.');
});

// Log Request Headers for Debugging
app.use((req, res, next) => {
  console.log('Request Headers:', req.headers);
  next();
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

// Schedule daily task reminders at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily task due notification job');
  try {
    const users = await User.find();
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
    const users = await User.find();
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

// Start HTTP server and redirect to HTTPS, excluding OPTIONS requests
http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
  } else {
    res.writeHead(301, { "Location": `https://${req.headers.host}${req.url}` });
    res.end();
  }
}).listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on port ${HTTP_PORT} and redirecting to HTTPS`);
});
