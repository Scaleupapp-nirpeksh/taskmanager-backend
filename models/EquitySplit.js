const mongoose = require('mongoose');

const founderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to user ID
  equity: { type: Number, required: true, min: 0, max: 100 },
});

const equitySplitSchema = new mongoose.Schema({
  founders: [founderSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to user who created this
}, { timestamps: true });

module.exports = mongoose.model('EquitySplit', equitySplitSchema);
