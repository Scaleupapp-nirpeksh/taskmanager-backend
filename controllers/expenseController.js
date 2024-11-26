// backend/controllers/expenseController.js
const Expense = require('../models/Expense');
const EquitySplit = require('../models/EquitySplit');
const mongoose = require('mongoose');
const MonthlyParity = require('../models/MonthlyParity');
const { createNotification } = require('./notificationController');
const User = require('../models/User'); 

exports.createExpense = async (req, res) => {
  try {
    const assignedUser = await User.findOne({ name: req.body.assigned_to });
    if (!assignedUser) {
      return res.status(404).json({ message: `User ${req.body.assigned_to} not found` });
    }

    req.body.assigned_to = assignedUser._id;
    const expense = await Expense.create(req.body);

    try {
      const notificationMessage = `${req.user.name} added an expense of ₹${expense.amount} to your name.`;
      await createNotification(expense.assigned_to, 'expense_added', notificationMessage);
    } catch (notificationError) {
      console.error('Error sending expense notification:', notificationError.message);
    }

    const expenseDate = new Date(expense.date);
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();
    let monthlyParity = await MonthlyParity.findOne({ month, year });

    const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);

    const expenses = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: "$assigned_to", totalSpent: { $sum: "$amount" } } }
    ]);

    const equitySplit = await EquitySplit.findOne().populate('founders.userId', 'name');
    if (!equitySplit) return res.status(404).json({ message: 'Equity split not found' });

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.totalSpent, 0);

    const parityData = equitySplit.founders.map(founder => {
      const founderExpense = expenses.find(exp => 
        new mongoose.Types.ObjectId(exp._id).equals(founder.userId._id)
      ) || { totalSpent: 0 };

      const expectedContribution = (totalSpent * founder.equity) / 100;
      const disparity = founderExpense.totalSpent - expectedContribution;

      return {
        founderId: founder.userId._id,
        name: founder.userId.name,
        expectedContribution,
        actualContribution: founderExpense.totalSpent,
        disparity
      };
    });

    if (monthlyParity) {
      monthlyParity.totalSpent = totalSpent;
      monthlyParity.parityData = parityData;
      await monthlyParity.save();
    } else {
      monthlyParity = new MonthlyParity({ month, year, totalSpent, parityData });
      await monthlyParity.save();
    }

    res.status(201).json({ expense, monthlyParity });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all expenses with filtering, sorting, and pagination
exports.getExpenses = async (req, res) => {
  const { user, category, subcategory, minAmount, maxAmount, startDate, endDate, sortBy, sortOrder, page = 1, limit = 10 } = req.query;

  // Building the query object
  let query = {};

  // Filtering by user (assigned_to), category, and subcategory
  if (user) query.assigned_to = user;
  if (category) query.category = category;
  if (subcategory) query.subcategory = subcategory;

  // Filtering by amount range
  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) query.amount.$gte = Number(minAmount);
    if (maxAmount) query.amount.$lte = Number(maxAmount);
  }

  // Filtering by date range
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Sorting
  const sortCondition = {};
  if (sortBy) {
    sortCondition[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sortCondition.date = -1; // Default sort by date, latest first
  }

  // Pagination
  const pageNumber = parseInt(page, 10);
  const resultsPerPage = parseInt(limit, 10);

  try {
    const expenses = await Expense.find(query)
      .sort(sortCondition)
      .skip((pageNumber - 1) * resultsPerPage)
      .limit(resultsPerPage);

    // Total count for pagination
    const totalExpenses = await Expense.countDocuments(query);

    res.json({
      expenses,
      totalPages: Math.ceil(totalExpenses / resultsPerPage),
      currentPage: pageNumber,
      totalExpenses,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get monthly summary by user, category, and subcategory with optional filters
exports.getMonthlySummary = async (req, res) => {
  const { user, category, subcategory, minAmount, maxAmount, startDate, endDate } = req.query;

  // Building the match stage of the aggregation pipeline
  let matchStage = {};

  // Apply user filter
  if (user) {
    matchStage["assigned_to"] = user;
  }

  // Apply category and subcategory filters
  if (category) {
    matchStage["category"] = category;
  }
  if (subcategory) {
    matchStage["subcategory"] = subcategory;
  }

  // Apply amount range filter
  if (minAmount || maxAmount) {
    matchStage["amount"] = {};
    if (minAmount) matchStage["amount"].$gte = parseFloat(minAmount);
    if (maxAmount) matchStage["amount"].$lte = parseFloat(maxAmount);
  }

  // Apply date range filter
  if (startDate || endDate) {
    matchStage["date"] = {};
    if (startDate) matchStage["date"].$gte = new Date(startDate);
    if (endDate) matchStage["date"].$lte = new Date(endDate);
  }

  try {
    const summary = await Expense.aggregate([
      { $match: matchStage }, // Apply filters
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            user: "$assigned_to",
            category: "$category",
            subcategory: "$subcategory"
          },
          totalAmount: { $sum: "$amount" }
        }
      },
      {
        $lookup: {
          from: 'users', // Collection name for users
          localField: '_id.user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          user: { $arrayElemAt: ["$userDetails.name", 0] }, // Replace user ID with username
          category: "$_id.category",
          subcategory: "$_id.subcategory",
          totalAmount: 1,
          _id: 0
        }
      },
      { $sort: { year: -1, month: -1, totalAmount: -1 } } // Sort by most recent month and highest amount
    ]);
    

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMonthlyInvestmentParity = async (req, res) => {
  const { month, year } = req.query;
  console.log(`Month: ${month}, Year: ${year}`);

  try {
    // Check if the monthly parity data is already stored
    const storedParity = await MonthlyParity.find({ year: { $lte: year }, month: { $lte: month } }).sort({ year: 1, month: 1 });

    // If data is found, return it
    if (storedParity.length) {
      return res.status(200).json(storedParity);
    }

    // Otherwise, calculate the parity data for the specified month and year
    const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);

    const expenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: "$assigned_to",
          totalSpent: { $sum: "$amount" }
        }
      }
    ]);

    console.log(expenses);

    const equitySplit = await EquitySplit.findOne().populate('founders.userId', 'name');
    if (!equitySplit) return res.status(404).json({ message: 'Equity split not found' });

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.totalSpent, 0);

    const parityData = equitySplit.founders.map(founder => {
      const founderExpense = expenses.find(exp => exp._id === founder.userId.name) || { totalSpent: 0 };
      const expectedContribution = (totalSpent * founder.equity) / 100;
      const disparity = founderExpense.totalSpent - expectedContribution;

      return {
        founderId: founder.userId._id,
        name: founder.userId.name,
        expectedContribution,
        actualContribution: founderExpense.totalSpent,
        disparity
      };
    });

    // Save the calculated parity data to the database
    const monthlyParity = new MonthlyParity({
      month,
      year,
      totalSpent,
      parityData
    });
    await monthlyParity.save();

    // Return the new parity data
    res.status(200).json([{ month, year, totalSpent, parityData }]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Confirm monthly parity settlement
exports.settleMonthlyDisparity = async (req, res) => {
  const { month, year } = req.body;
  try {
    // Fetch the MonthlyParity document for the specified month and year
    let monthlyParity = await MonthlyParity.findOne({ month, year });
    if (!monthlyParity) {
      return res.status(404).json({ message: 'Monthly parity not found' });
    }

    // Mark the month as settled
    monthlyParity.settled = true;
    await monthlyParity.save();

    res.status(200).json({ message: 'Month marked as settled', monthlyParity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Fetch all monthly parities
exports.getAllMonthlyParities = async (req, res) => {
  try {
    // Retrieve all stored monthly parities, sorted by year and month
    const monthlyParities = await MonthlyParity.find().sort({ year: 1, month: 1 });

    if (!monthlyParities.length) {
      return res.status(404).json({ message: 'No monthly parity data found.' });
    }

    // Format the response for each month
    const response = monthlyParities.map(parity => ({
      month: parity.month,
      year: parity.year,
      totalSpent: parity.totalSpent,
      parityData: parity.parityData.map(data => ({
        founderId: data.founderId,
        name: data.name,
        expectedContribution: data.expectedContribution,
        actualContribution: data.actualContribution,
        disparity: data.disparity
      })),
      settled: parity.settled
    }));

    // Return all months' parity data
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



