const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  addNote,
  getTaskById,
  getOverdueTasks,
} = require('../controllers/taskController');

const router = express.Router();

// Task routes
router.post('/create', protect, createTask); // Create a new task
router.get('/overdue', protect, getOverdueTasks); // Get only overdue tasks
router.get('/', protect, getTasks); // Get all tasks with filters
router.get('/:id', protect, getTaskById); // Get a task by ID
router.put('/:id', protect, updateTask); // Update a task
router.delete('/:id', protect, deleteTask); // Delete a task
router.post('/:id/notes', protect, addNote); // Add a note to a task

module.exports = router;
