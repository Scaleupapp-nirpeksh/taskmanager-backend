// backend/controllers/dashboardController.js
const EquitySplit = require('../models/EquitySplit');
const Task = require('../models/Task');
const Expense = require('../models/Expense');
const MonthlyParity = require('../models/MonthlyParity');
const mongoose = require('mongoose');


exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email; // Assuming you have the user's email in req.user
    const userName = req.user.name;   // Assuming you have the user's name in req.user

    // Fetch user's equity split
    const equitySplit = await EquitySplit.findOne({
      'founders.userId': userId
    }).populate('founders.userId', 'name');

    let userEquity;
    if (equitySplit) {
      userEquity = equitySplit.founders.find(founder =>
        founder.userId._id.toString() === userId.toString()
      );
    }

    // Fetch tasks assigned to the user
    const tasks = await Task.find({ assignedTo: userId }).populate('category', 'categoryName');
    const overdueTasks = tasks.filter(task => new Date(task.deadline) < new Date() && task.status !== 'Completed');
    const taskStats = {
      totalTasks: tasks.length,
      totalOverdue: overdueTasks.length,
      totalInProgress: tasks.filter(task => task.status === 'In Progress').length,
      totalCompleted: tasks.filter(task => task.status === 'Completed').length
    };

    // Fetch user's expenses
    // Adjust the query to match the type of data stored in assigned_to
    const userExpenses = await Expense.find({ assigned_to: userName }); // Use the correct field here

    const monthlyExpenses = await MonthlyParity.find({ 'parityData.founderId': userId }).sort({ year: 1, month: 1 });

    const investmentDetails = monthlyExpenses.map(parity => {
      const userParityData = parity.parityData.find(data =>
        data.founderId.toString() === userId.toString()
      );
      return {
        month: parity.month,
        year: parity.year,
        expectedContribution: userParityData ? userParityData.expectedContribution : 0,
        actualContribution: userParityData ? userParityData.actualContribution : 0,
        disparity: userParityData ? userParityData.disparity : 0,
        isEven: userParityData ? userParityData.disparity === 0 : false,
        status: userParityData
          ? userParityData.disparity === 0
            ? 'Even'
            : userParityData.disparity > 0
            ? 'Needs Collection' // Corrected here
            : 'Owes Money'
          : 'No Data',
        detailedExpenses: userExpenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return (
            expenseDate.getMonth() + 1 === parity.month &&
            expenseDate.getFullYear() === parity.year
          );
        }).map(expense => ({
          name: expense.expense_name,
          amount: expense.amount,
          date: expense.date,
          category: expense.category,
          subcategory: expense.subcategory
        }))
      };
    });

    res.status(200).json({
      equitySplit: userEquity || 'Not part of any equity split',
      taskStats,
      tasks,
      investmentDetails,
      totalInvestment: investmentDetails.reduce((sum, detail) => sum + detail.actualContribution, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};