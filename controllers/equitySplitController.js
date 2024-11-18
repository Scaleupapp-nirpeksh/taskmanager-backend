const EquitySplit = require('../models/EquitySplit');
const User = require('../models/User'); // Assuming User model is in models folder



exports.getEquitySplit = async (req, res) => {
  try {
    // Fetch the existing equity split, if available
    const equitySplit = await EquitySplit.findOne().populate('founders.userId', 'name');

    // Fetch all users if no equity split is found
    if (!equitySplit) {
      const users = await User.find({}, 'name'); // Fetch all users with just their names
      return res.status(200).json({
        message: 'No equity split found. Listing all users for setup.',
        equitySplit: null,
        users: users.map(user => ({ id: user._id, name: user.name })),
      });
    }

    res.status(200).json({
      message: 'Equity split found.',
      equitySplit: equitySplit.founders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve equity split', error: error.message });
  }
};
  
  

  exports.saveEquitySplit = async (req, res) => {
    const { founders } = req.body;
  
    // Check that the total equity sums to 100
    const totalEquity = founders.reduce((total, founder) => total + founder.equity, 0);
    if (totalEquity !== 100) {
      return res.status(400).json({ message: 'Total equity must equal 100%' });
    }
  
    try {
      // Find and update the existing equity split, or create it if none exists
      const equitySplit = await EquitySplit.findOneAndUpdate(
        {},  // No specific filter, allowing global access
        { founders },
        { new: true, upsert: true }  // 'upsert' option to create if not found
      );
  
      res.status(200).json({ message: 'Equity split saved successfully', equitySplit });
    } catch (error) {
      res.status(500).json({ message: 'Failed to save equity split', error: error.message });
    }
  };
  