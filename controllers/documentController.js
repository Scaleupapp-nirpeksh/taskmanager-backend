// backend/controllers/documentController.js
const Document = require('../models/Document');
const { s3, GetObjectCommand, DeleteObjectsCommand } = require('../utils/s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { createNotification } = require('./notificationController');

// Create a new document
exports.createDocument = async (req, res) => {
  const { title, content, collaborators } = req.body;
  const files = req.files;

  try {
    const attachments = files.map(file => ({
      filename: file.originalname,
      url: file.location, // The URL of the file in S3
      key: file.key, // The key of the file in S3
    }));

    const document = new Document({
      title,
      content,
      owner: req.user._id,
      collaborators,
      attachments,
    });

    const createdDocument = await document.save();
    res.status(201).json(createdDocument);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDocument = async (req, res) => {
  const { title, content, collaborators } = req.body;
  const files = req.files;

  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Determine permissions
    const isOwner = document.owner.equals(req.user._id);
    const collaborator = document.collaborators.find(collab => collab.user.equals(req.user._id));
    const hasWriteAccess = isOwner || (collaborator && collaborator.permission === 'write');

    if (!hasWriteAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Save current version
    document.versions.push({
      content: document.content,
      attachments: document.attachments,
      versionNumber: document.versions.length + 1,
      createdAt: new Date(),
    });

    // Update document fields
    if (title) document.title = title;
    if (content) document.content = content;

    // Handle new attachments
    if (files && files.length > 0) {
      const newAttachments = files.map(file => ({
        filename: file.originalname,
        url: file.location,
        key: file.key,
      }));
      document.attachments = document.attachments.concat(newAttachments);
    }

    // Only the owner can update collaborators
    if (isOwner && collaborators) {
      // Validate collaborators before updating
      document.collaborators = collaborators;
    }

    const updatedDocument = await document.save();

    // Notify owner and collaborators
    const notificationMessage = `${req.user.name} updated the document "${document.title}"`;

    try {
      // Notify the owner
      
        await createNotification(document.owner._id, 'document_updated', notificationMessage);
      
      // Notify collaborators
      await Promise.all(
        document.collaborators
          .filter(collab => !collab.user.equals(req.user._id))
          .map(collab =>
            createNotification(collab.user._id, 'document_updated', notificationMessage)
          )
      );
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError.message);
    }

    res.json(updatedDocument);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
  
// Get all documents accessible to the user
exports.getDocuments = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

    const documents = await Document.find({
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id },
      ],
    })
    .select('title owner collaborators createdAt updatedAt likes')
    .skip(skip)
    .limit(limit)
    .populate('owner', 'name email')
    .populate('collaborators.user', 'name email');


    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email')
      .populate('comments.user', 'name email'); // Populate comment users

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if the user has access
    const isOwner = document.owner.equals(req.user._id);
    const collaborator = document.collaborators.find((collab) =>
      collab.user.equals(req.user._id)
    );
    const hasAccess = isOwner || collaborator;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate pre-signed URLs for attachments
    const attachmentsWithSignedUrls = await Promise.all(
      document.attachments.map(async (attachment) => {
        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: attachment.key,
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour

        return {
          ...attachment.toObject(),
          url: signedUrl,
        };
      })
    );

    const documentData = document.toObject();
    documentData.attachments = attachmentsWithSignedUrls;

    res.json(documentData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
  
// Delete a document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only the owner can delete the document
    if (!document.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete attachments from S3
    if (document.attachments.length > 0) {
      const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Delete: {
          Objects: document.attachments.map((attachment) => ({ Key: attachment.key })),
        },
      };

      await s3.send(new DeleteObjectsCommand(deleteParams));
    }

    await document.deleteOne();
    res.json({ message: 'Document and attachments deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addComment = async (req, res) => {
  const { content } = req.body;

  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if the user has access to the document
    const isOwner = document.owner.equals(req.user._id);
    const collaborator = document.collaborators.find((collab) =>
      collab.user.equals(req.user._id)
    );
    const hasAccess = isOwner || collaborator;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add the comment
    const comment = {
      user: req.user._id,
      content,
    };
    document.comments.push(comment);
    await document.save();

    console.log('Comment added:', comment);

       console.log('Sending notification to owner:', document.owner._id);

      const ownerNotification =  createNotification(
        document.owner._id,
        'comment_added',
        `${req.user.name} commented on your document: "${content}"`
      );

      console.log('Owner Notification Result:', ownerNotification);
    

    // Notify all collaborators except the commenter
    const collaboratorNotifications = await Promise.all(
      document.collaborators
        .filter((collab) => !collab.user.equals(req.user._id))
        .map(async (collab) => {
          console.log('Sending notification to collaborator:', collab.user._id);

          return createNotification(
            collab.user._id,
            'comment_added',
            `${req.user.name} commented on a document you collaborate on: "${content}"`
          );
        })
    );

    console.log('Collaborator Notifications Results:', collaboratorNotifications);

    // Optionally populate the user field
    await document.populate('comments.user', 'name email');

    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    console.error('Error in addComment:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.likeDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate('owner', 'name email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if the user has already liked the document
    if (document.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already liked this document' });
    }

    document.likes.push(req.user._id);
    await document.save();

    // Notify the owner
    const notificationMessage = `${req.user.name} liked your document "${document.title}"`;

    try {
        await createNotification(document.owner._id, 'document_liked', notificationMessage);
      
    } catch (notificationError) {
      console.error('Error sending like notification:', notificationError.message);
    }

    res.json({ message: 'Document liked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Unlike a document
exports.unlikeDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if the user has liked the document
    if (!document.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have not liked this document' });
    }

    document.likes = document.likes.filter(
      (userId) => !userId.equals(req.user._id)
    );
    await document.save();

    res.json({ message: 'Document unliked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

