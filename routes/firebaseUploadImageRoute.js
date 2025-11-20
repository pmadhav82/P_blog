const firebase = require("../utils/firebase-admin-config");
const firebaseUpload = require("../utils/firebaseImageUpload");
const {islogin} = require("../utils/loginHandeler");
const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const firebaseImageUploadRoute = require("express").Router();


const BUCKET_NAME = "pblog-5795d.firebasestorage.app";
const bucket = firebase.storage().bucket(BUCKET_NAME);


firebaseImageUploadRoute.post("/", firebaseUpload.single("firebase-image"), async(req,res)=>{
    if (!req.file) {
    return res.status(400).json({
      message: "No image selected",
      success: false,
    });
  }


  try{
const fileExt = path.extname(req.file.originalname);
  const fileName = `${crypto.randomBytes(16).toString("hex")}.${fileExt}`;
const file = bucket.file(fileName);

  await file.save(req.file.buffer,{
  metadata:{
    contentType:req.file.mimetype
  }
});

await file.makePublic();

const BASE_URL = "https://storage.googleapis.com";

const publicUrl = `${BASE_URL}/${BUCKET_NAME}/${fileName}`;

  res.json({success:true,message:"Image upload to firebase successfully...", publicUrl});
}catch(er){
 res.status(500).json({ message: er.message, success: false });
}

})

module.exports = firebaseImageUploadRoute;





// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });


// // Route to upload image
// router.post("/upload", islogin, upload.single("image"), async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: "No file uploaded" });
//         }

//         // Generate a unique filename
//         const filename = `${crypto.randomBytes(16).toString("hex")}${path.extname(req.file.originalname)}`;

//         // Upload to Firebase Storage
//         const file = bucket.file(filename);
//         await file.save(req.file.buffer, {
//             metadata: { contentType: req.file.mimetype }
//         });
// await file.makePublic();

//         // Get public URL
//         const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      

//         res.json({ success: true, url: publicUrl, id: docRef.id });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// module.exports = router;