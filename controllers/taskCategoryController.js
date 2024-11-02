// backend/controllers/taskCategoryController.js
const TaskCategory = require('../models/TaskCategory');

// Create or update a task category
exports.createCategory = async (req, res) => {
    const { categoryName, subcategories } = req.body;
  
    try {
      // Find the category by name
      let category = await TaskCategory.findOne({ categoryName });
  
      if (category) {
        // If category exists, add only new unique subcategories
        const newSubcategories = subcategories.filter(sub => !category.subcategories.includes(sub));
  
        if (newSubcategories.length === 0) {
          return res.status(400).json({ message: 'This category-subcategory combination already exists.' });
        }
  
        category.subcategories.push(...newSubcategories);
        await category.save();
      } else {
        // If category does not exist, create a new one
        category = await TaskCategory.create({ categoryName, subcategories });
      }
  
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await TaskCategory.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
