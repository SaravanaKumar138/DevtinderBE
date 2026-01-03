const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION || "ap-south-1",
});

const s3 = new AWS.S3();

const uploadToS3 = async (file) => {
  const key = `profile-images/${uuidv4()}-${file.originalname}`;

  await s3
    .upload({
      Bucket: "devtinder-images",
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
    .promise();

  // Cloudflare CDN URL
  return `https://cdn.devstinder.in/${key}`;
};

module.exports = uploadToS3;
