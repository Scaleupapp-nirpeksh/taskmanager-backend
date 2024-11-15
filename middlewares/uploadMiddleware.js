// backend/middlewares/uploadMiddleware.js
require('dotenv').config(); // Add this line at the top
const multer = require('multer');
const multerS3 = require('multer-s3-v3');
const { S3Client } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'private', // or 'public-read' depending on your needs
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const userId = req.user._id.toString();
      const timestamp = Date.now().toString();
      const fileKey = `documents/${userId}/${timestamp}-${file.originalname}`;
      cb(null, fileKey);
    },
  }),
});

module.exports = upload;
