// backend/models/Document.js
const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  filename: String,
  url: String,
  key: String, // S3 object key
});

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const DocumentVersionSchema = new mongoose.Schema({
  content: String,
  attachments: [AttachmentSchema],
  versionNumber: Number,
  createdAt: { type: Date, default: Date.now },
});

const DocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String, // Could be HTML or Markdown
      required: true,
    },
    versions: [DocumentVersionSchema],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permission: { type: String, enum: ['read', 'write'], default: 'read' },
      },
    ],
    attachments: [AttachmentSchema],
    comments: [CommentSchema], // Added comments field
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Added likes field
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', DocumentSchema);
