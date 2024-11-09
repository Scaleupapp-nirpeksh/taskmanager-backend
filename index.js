//Prod Code
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

// Load SSL certificates for HTTPS
const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/nirpekshnandan.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/nirpekshnandan.com/fullchain.pem'),
};

const HTTPS_PORT = 443;
const HTTP_PORT = 80;

// Define allowed origins for CORS
const allowedOrigins = [
  'https://nirpeksh.com',
  'https://nirpekshnandan.com',
  'https://master.dri5c16mhxrkg.amplifyapp.com',
  'https://prod.d13hd8ekmv548z.amplifyapp.com',
  'https://master.dp6erxymzofdg.amplifyapp.com',
  'https://master.d2rgoocsk44jed.amplifyapp.com',
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

// Schedule daily task reminders at 9 AM IST
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily task due notification job at 9 AM IST');
  try {
    const users = await User.find();
    for (const user of users) {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const dueTasks = await Task.find({
        assignedTo: user._id,
        deadline: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'Completed' },
      });

      if (Array.isArray(dueTasks) && dueTasks.length > 0) {
        await notifyDueTasks(user.phone_number, user.name, dueTasks);
      }
    }
  } catch (error) {
    console.error('Error sending daily due notifications:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// **Updated** Schedule overdue task notifications at 9:30 AM IST
cron.schedule('35 10 * * *', async () => {
  console.log('Running daily overdue task notification job at 9:30 AM IST');
  try {
    const users = await User.find();
    for (const user of users) {
      const today = new Date();
      const overdueTasks = await Task.find({
        assignedTo: user._id,
        deadline: { $lt: today },
        status: { $ne: 'Completed' },
      });

      if (Array.isArray(overdueTasks) && overdueTasks.length > 0) {
        await notifyOverdueTasks(user.phone_number, user.name, overdueTasks);
      }
    }
  } catch (error) {
    console.error('Error sending daily overdue notifications:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
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

