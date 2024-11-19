const EquitySplit = require('../models/EquitySplit');
const User = require('../models/User'); // Assuming User model is in models folder
const { createNotification } = require('./notificationController');


exports.getEquitySplit = async (req, res) => {
  try {
    // Fetch the existing equity split
    const equitySplit = await EquitySplit.findOne().populate('founders.userId', 'name');

    // Fetch all users
    const allUsers = await User.find({}, 'name'); // Fetch all users with just their names

    // Include users not in the equity split
    const usersNotInSplit = allUsers.filter(user =>
      !equitySplit?.founders.some(founder => founder.userId._id.equals(user._id))
    );

    // Merge users from equitySplit and new users
    const responseUsers = equitySplit
      ? [
          ...equitySplit.founders.map(founder => ({
            id: founder.userId._id,
            name: founder.userId.name,
            equity: founder.equity,
          })),
          ...usersNotInSplit.map(user => ({
            id: user._id,
            name: user.name,
            equity: 0, // Default equity for new users
          })),
        ]
      : allUsers.map(user => ({
          id: user._id,
          name: user.name,
          equity: 0,
        }));

    res.status(200).json({ founders: responseUsers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve equity split', error: error.message });
  }
};

  

exports.saveEquitySplit = async (req, res) => {
  const { founders } = req.body;

  const totalEquity = founders.reduce((total, founder) => total + founder.equity, 0);
  if (totalEquity !== 100) {
    return res.status(400).json({ message: 'Total equity must equal 100%' });
  }

  try {
    const equitySplit = await EquitySplit.findOneAndUpdate(
      {},
      { founders },
      { new: true, upsert: true }
    );

    // Notify all founders
    founders.forEach(founder => {
      createNotification(
        founder.userId,
        'equity_split_updated',
        `The equity split has been updated. Your current equity is ${founder.equity}%.`
      );
    });

    res.status(200).json({ message: 'Equity split saved successfully', equitySplit });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save equity split', error: error.message });
  }
};
  