// backend/models/MonthlyParity.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending' } // Can be 'pending' or 'completed'
});

const monthlyParitySchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  totalSpent: { type: Number, required: true },
  parityData: [
    {
      founderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, required: true },
      expectedContribution: { type: Number, required: true },
      actualContribution: { type: Number, required: true },
      disparity: { type: Number, required: true }
    }
  ],
  settlementTransactions: [transactionSchema], // Track suggested transactions
  settled: { type: Boolean, default: false } // Flag to mark month as fully settled
}, { timestamps: true });

module.exports = mongoose.model('MonthlyParity', monthlyParitySchema);
