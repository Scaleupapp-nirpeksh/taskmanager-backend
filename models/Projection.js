// models/Projection.js
const mongoose = require('mongoose');

const projectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  durationMonths: { type: Number, required: true },
  totalProjectedExpense: { type: Number, default: 0 },
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectedExpense' }],
  monthlyExpenses: [
    {
      expenseName: String,
      category: String,
      subCategory: String,
      amount: Number,
      recurrence: String,
      notes: String,
      monthlyExpense: Number,
      total: Number
    }
  ],
  founderContributions: [
    {
      founderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      contributionPerMonth: Number,
      totalContribution: Number,
    }
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Projection', projectionSchema);
