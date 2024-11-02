// backend/routes/taskRoutes.js
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  addNote,
  getTaskById,
} = require('../controllers/taskController');

const router = express.Router();

// Task routes
router.post('/', protect, createTask); // Create a new task
router.get('/', protect, getTasks); // Get all tasks with filters
router.get('/:id', protect, getTaskById); // Get a task by ID
router.put('/:id', protect, updateTask); // Update a task
router.delete('/:id', protect, deleteTask); // Delete a task
router.post('/:id/notes', protect, addNote); // Add a note to a task

module.exports = router;
