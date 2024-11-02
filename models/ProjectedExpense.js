// models/ProjectedExpense.js
const mongoose = require('mongoose');

const projectedExpenseSchema = new mongoose.Schema({
  projection: { type: mongoose.Schema.Types.ObjectId, ref: 'Projection', required: true }, // Link to parent projection
  expenseName: { type: String, required: true }, // Name of the expense
  category: { type: String, required: true }, // Category (from existing categories)
  subCategory: { type: String, required: true }, // Subcategory (from existing categories)
  amount: { type: Number, required: true }, // Expense amount
  recurrence: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly'], required: true }, // Recurrence
  notes: { type: String }, // Optional notes
});

module.exports = mongoose.model('ProjectedExpense', projectedExpenseSchema);
