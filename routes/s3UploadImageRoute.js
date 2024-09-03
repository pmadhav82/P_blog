const s3UploadImageRoute = require("express").Router();
const {S3Client, PutObjectCommand} = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const s3Upload = require("../utils/s3ImageUpload");

const client = new S3Client({
    region: "ap-southeast-2",
    credentials:{
        accessKeyId:process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
    }
})





s3UploadImageRoute.post("/", s3Upload.single("s3Image"), async (req, res) => {
if(!req.file) {
res.status(400)
throw new Error("No image selected");

}




const input ={
    "Bucket":"pblog-images-bucket",
    "Key": `${crypto.randomBytes(16).toString("hex")}_${req.file.originalname}`,
    "Body": req.file.buffer

};


const command = new PutObjectCommand(input);
try{
    const response = await client.send(command);
    console.log(response);

}catch(er){
    console.log(er.message)
   throw new Error(er)
    
}

 

  res.json({ message: "aws-s3-image-upload-route-success", success: true });
});

module.exports = s3UploadImageRoute;
