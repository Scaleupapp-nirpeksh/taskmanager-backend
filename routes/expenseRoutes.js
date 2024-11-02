// backend/routes/expenseRoutes.js
const express = require('express');
const router = express.Router();
const { createExpense, getExpenses, getMonthlySummary, getMonthlyInvestmentParity, settleMonthlyDisparity, getAllMonthlyParities } = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');

// POST /expenses - Add a new expense
router.post('/', protect, createExpense);

// GET /expenses - Retrieve all expenses
router.get('/', protect, getExpenses);

router.get('/monthly-summary',  getMonthlySummary);

// GET /expenses/investment-parity - Calculate monthly parity
router.get('/investment-parity', getMonthlyInvestmentParity);

// POST /expenses/settle-month - Settle monthly disparity
router.post('/settle-month', settleMonthlyDisparity);

// GET /expenses/all-parities - Fetch all stored monthly parities
router.get('/all-parities', getAllMonthlyParities);


module.exports = router;
