// backend/routes/documentRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} = require('../controllers/documentController');

// Route to create a new document with file uploads
router
  .route('/')
  .post(protect, upload.array('attachments'), createDocument)
  .get(protect, getDocuments);

// Route to get, update, and delete a document
router
  .route('/:id')
  .get(protect, getDocumentById)
  .put(protect, upload.array('attachments'), updateDocument)
  .delete(protect, deleteDocument);

module.exports = router;
