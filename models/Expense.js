// backend/models/Expense.js
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  expense_name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    required: true,
  },
  subcategory: {
    type: String,
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  notes: {
    type: String,
  },
  attachment_url: {
    type: String, // URL for a receipt image or other relevant file
  },
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
