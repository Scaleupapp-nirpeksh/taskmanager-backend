// controllers/projectionController.js
const Projection = require('../models/Projection');
const ProjectedExpense = require('../models/ProjectedExpense');
const EquitySplit = require('../models/EquitySplit'); 
const mongoose = require('mongoose');

// Create a new projection
  exports.createProjection = async (req, res) => {
  try {
    const { name, durationMonths, expenses } = req.body;

    // Create the Projection document
    const projection = new Projection({
      name,
      durationMonths,
      createdBy: req.user._id,
    });
    await projection.save();

    // Create each projected expense linked to the projection
    const projectedExpenses = await ProjectedExpense.insertMany(
      expenses.map(exp => ({
        ...exp,
        projection: projection._id,
      }))
    );

    // Link projected expenses to the projection and save
    projection.expenses = projectedExpenses.map(exp => exp._id);
    await projection.save();

    // Trigger calculation immediately after creating projection
    const calculationResult = await exports.calculateProjection(projection._id);

    // Respond with the created projection and calculated data
    res.status(201).json({
      message: 'Projection created successfully',
      projection,
      calculation: calculationResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Calculate expenses based on saved projection and duration
exports.calculateProjection = async (projectionId) => {
  try {
    // Fetch the projection and its expenses by ID
    console.log("projectionId:", projectionId);
const projection = await Projection.findById(projectionId).populate('expenses');
console.log("Fetched projection:", projection);

    if (!projection) throw new Error('Projection not found');

    // Get the projection duration and expenses
    const { durationMonths, expenses } = projection;

    // Calculate total expense for the period based on recurrence
    let totalProjectedExpense = 0;
    const monthlyExpenses = expenses.map(exp => {
      let monthlyExpense = 0;
      switch (exp.recurrence) {
        case 'daily':
          monthlyExpense = exp.amount * 30;
          break;
        case 'weekly':
          monthlyExpense = exp.amount * 4;
          break;
        case 'monthly':
          monthlyExpense = exp.amount;
          break;
        case 'quarterly':
          monthlyExpense = exp.amount / 3;
          break;
      }
      return { ...exp.toObject(), monthlyExpense, total: monthlyExpense * durationMonths };
    });

    totalProjectedExpense = monthlyExpenses.reduce((sum, exp) => sum + exp.total, 0);

    // Calculate per-founder contribution based on equity split
    const equitySplit = await EquitySplit.findOne();
    if (!equitySplit) throw new Error('Equity split not found');

    const founderContributions = equitySplit.founders.map(founder => ({
      founderId: founder.userId,
      name: founder.name,
      contributionPerMonth: (totalProjectedExpense * (founder.equity / 100)) / durationMonths,
      totalContribution: totalProjectedExpense * (founder.equity / 100),
    }));

    // Update the projection document with calculated values
    projection.totalProjectedExpense = totalProjectedExpense;
    projection.monthlyExpenses = monthlyExpenses;
    projection.founderContributions = founderContributions;
    await projection.save();

    return { monthlyExpenses, totalProjectedExpense, founderContributions };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Fetch a saved projection
exports.getProjection = async (req, res) => {
  try {
    const { id } = req.params;
    const projection = await Projection.findById(id).populate('expenses').populate('createdBy', 'name');
    if (!projection) return res.status(404).json({ message: 'Projection not found' });
    res.status(200).json(projection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit a projection
exports.editProjection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, durationMonths, expenses } = req.body;

    // Update projection details
    const projection = await Projection.findByIdAndUpdate(id, { name, durationMonths }, { new: true });
    if (!projection) return res.status(404).json({ message: 'Projection not found' });

    // Delete old expenses and add new ones
    await ProjectedExpense.deleteMany({ projection: id });
    const updatedExpenses = await ProjectedExpense.insertMany(
      expenses.map(exp => ({ ...exp, projection: id }))
    );

    // Update the projection's expense references and save
    projection.expenses = updatedExpenses.map(exp => exp._id);
    await projection.save();

    // Trigger calculation immediately after editing the projection
    const calculationResult = await exports.calculateProjection(projection._id);

    // Respond with the updated projection and calculated data
    res.status(200).json({
      message: 'Projection updated successfully',
      projection,
      calculation: calculationResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.deleteProjection = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid projection ID' });
    }

    // Proceed to delete if valid
    await Projection.findByIdAndDelete(id);
    await ProjectedExpense.deleteMany({ projection: id });
    
    res.status(200).json({ message: 'Projection deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// controllers/projectionController.js
exports.getAllProjections = async (req, res) => {
  try {
    // Fetch all projections with their expenses and creator information
    const projections = await Projection.find({})
      .populate('expenses')
      .populate('createdBy', 'name')
      .populate({
        path: 'founderContributions.founderId', // Populate founderId inside founderContributions
        select: 'name', // Only retrieve the name field
      });

    // Map projections to format the response data
    const projectionsData = projections.map(projection => {
      // Calculate total monthly expenses and founder contributions from saved data
      const { _id,name, durationMonths, totalProjectedExpense, monthlyExpenses, founderContributions } = projection;

      return {
        _id,
        name,
        durationMonths,
        totalProjectedExpense,
        overallMonthlyExpense: (totalProjectedExpense / durationMonths).toFixed(2),
        founderContributions: founderContributions.map(contribution => ({
          founderName: contribution.founderId.name, // Access founder's name directly
          contributionPerMonth: contribution.contributionPerMonth.toFixed(2),
          totalContribution: contribution.totalContribution.toFixed(2),
        })),
        monthlyExpenses, // Details of individual expenses in the projection
      };
    });

    res.status(200).json({ projections: projectionsData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

