const s3UploadImageRoute = require("express").Router();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const s3Upload = require("../utils/s3ImageUpload");

const client = new S3Client({
  region: "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  },
});

const bucketURL = "https://pblog-images-bucket.s3.ap-southeast-2.amazonaws.com";

s3UploadImageRoute.post("/", s3Upload.single("s3Image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image selected",
      success: false,
    });
  }

  const fileName = `${crypto.randomBytes(16).toString("hex")}_${
    req.file.originalname
  }`;

  const input = {
    Bucket: "pblog-images-bucket",
    Key: fileName,
    Body: req.file.buffer,
  };

  const command = new PutObjectCommand(input);
  try {
    const response = await client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error("Failed to upload image to s3 bucket");
      
    }

    res.json({ imageURL: `${bucketURL}/${fileName}`, success: true });
  } catch (er) {
    console.log(er);
    res.status(500).json({ message: er.message, success: false });
  }
});

module.exports = s3UploadImageRoute;
