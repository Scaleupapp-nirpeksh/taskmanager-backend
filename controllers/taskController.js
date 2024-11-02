// backend/controllers/taskController.js
const Task = require('../models/Task');
const TaskCategory = require('../models/TaskCategory');

exports.createTask = async (req, res) => {
  console.log("Received create task request:", req.body);
  const { title, description, category, subcategory, deadline, status, assignedTo } = req.body;
  try {
    const taskCategory = await TaskCategory.findOne({ categoryName: category });
    if (!taskCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const task = await Task.create({
      title,
      description,
      category: taskCategory._id,
      subcategory,
      deadline,
      status,
      assignedTo,
      createdBy: req.user._id,
    });
    res.status(201).json(task);
  } catch (error) {
    console.error("Error in createTask:", error);
    res.status(500).json({ error: error.message });
  }
};




// Get tasks with optional filters
exports.getTasks = async (req, res) => {
  const { category, subcategory, status, assignedTo, startDate, endDate } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;

  // Add date range filter if both startDate and endDate are provided
  if (startDate && endDate) {
    filter.deadline = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    filter.deadline = { $gte: new Date(startDate) };
  } else if (endDate) {
    filter.deadline = { $lte: new Date(endDate) };
  }

  try {
    const tasks = await Task.find(filter).populate('category assignedTo', 'categoryName name');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOverdueTasks = async (req, res) => {
  const filter = { status: { $ne: 'Completed' }, deadline: { $lt: new Date() } };

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

    // Assuming req.user contains the logged-in user information
    const createdByName = req.user.name;

    // Add the note with both createdBy (ID) and createdByName (name)
    task.notes.push({ content, createdBy: req.user._id, createdByName });
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
