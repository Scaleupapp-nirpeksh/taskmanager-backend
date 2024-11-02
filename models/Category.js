// backend/models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
  },
  subcategory_name: {
    type: String,
    required: true,
  },
});

// Compound index to ensure unique category and subcategory combination
CategorySchema.index({ category_name: 1, subcategory_name: 1 }, { unique: true });

module.exports = mongoose.model('Category', CategorySchema);
