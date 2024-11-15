// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  // Remove the credentials property
});

router.get('/presigned-url', protect, async (req, res) => {
  const { filename, filetype } = req.query;
  const userId = req.user._id.toString();
  const timestamp = Date.now().toString();
  const key = `documents/${userId}/${timestamp}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: filetype,
    ACL: 'private',
  });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    res.json({ url, key });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
