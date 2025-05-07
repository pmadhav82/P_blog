const s3UploadImageRoute = require("express").Router();
const {  PutObjectCommand } = require("@aws-sdk/client-s3");
const client = require("../utils/s3Client");
const crypto = require("crypto");
const path = require("path");
const s3Upload = require("../utils/s3ImageUpload");
const {islogin} = require("../utils/loginHandeler");



const bucketURL = "https://pblog-images-bucket.s3.ap-southeast-2.amazonaws.com";

s3UploadImageRoute.post("/", islogin, s3Upload.single("s3Image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image selected",
      success: false,
    });
  }


const fileExt = path.extname(req.file.originalname);
  const fileName = `${crypto.randomBytes(16).toString("hex")}.${fileExt}`;

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
