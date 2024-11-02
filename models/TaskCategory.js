// backend/models/TaskCategory.js
const mongoose = require('mongoose');

const taskCategorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  subcategories: [{ type: String }] // List of subcategories as strings
}, { timestamps: true });

module.exports = mongoose.model('TaskCategory', taskCategorySchema);
