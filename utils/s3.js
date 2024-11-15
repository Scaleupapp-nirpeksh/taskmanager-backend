// backend/utils/s3.js
require('dotenv').config(); // Add this line at the top
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});


// backend/utils/s3.js
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Loaded' : 'Not Loaded');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Loaded' : 'Not Loaded');
console.log('AWS_REGION:', process.env.AWS_REGION ? 'Loaded' : 'Not Loaded');


module.exports = {
  s3,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
};
