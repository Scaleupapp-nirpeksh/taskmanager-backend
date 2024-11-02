// routes/projectionRoutes.js
const express = require('express');
const projectionController = require('../controllers/projectionController');
const { protect } = require('../middlewares/authMiddleware'); // Ensure correct path to protect middleware

const router = express.Router();

// Place specific routes before the generic /:id route
router.post('/', protect , projectionController.createProjection);
router.post('/calculate', projectionController.calculateProjection); // POST might be more appropriate for calculations with data in the body

// Route to get all projections with details
router.get('/all', projectionController.getAllProjections);


// Fetch a saved projection
router.get('/:id', projectionController.getProjection);

// Edit a projection
router.put('/:id', projectionController.editProjection);

// Delete a projection
router.delete('/:id', projectionController.deleteProjection);

module.exports = router;
