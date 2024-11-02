// backend/controllers/taskController.js
const Task = require('../models/Task');
const TaskCategory = require('../models/TaskCategory');

// Create a new task
exports.createTask = async (req, res) => {
    const { title, description, category, subcategory, deadline, status, assignedTo } = req.body;
    try {
      // Find the category by name to get its ObjectId
      const taskCategory = await TaskCategory.findOne({ categoryName: category });
      if (!taskCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      // Create the task with the ObjectId of the category
      const task = await Task.create({
        title,
        description,
        category: taskCategory._id, // Use the ObjectId here
        subcategory,
        deadline,
        status,
        assignedTo,
        createdBy: req.user._id,
      });
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

// Get tasks with optional filters
exports.getTasks = async (req, res) => {
  const { category, subcategory, status, assignedTo } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;

  try {
    const tasks = await Task.find(filter).populate('category assignedTo', 'categoryName name');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a note to a task
exports.addNote = async (req, res) => {
  const { content } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.notes.push({ content, createdBy: req.user._id });
    await task.save();
    res.status(201).json(task.notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('category assignedTo', 'categoryName name');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
