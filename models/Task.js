// backend/models/Task.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  createdByName: String,
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskCategory', required: true },
  subcategory: { type: String, required: true },
  deadline: { type: Date, required: true },
  notes: [noteSchema], 
  status: { type: String, enum: ['To Do', 'In Progress', 'Completed'], default: 'To Do' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
