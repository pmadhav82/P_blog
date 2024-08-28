const multer = require("multer");

const s3Upload = multer({
    limits:{
        fileSize:10000000
    },
fileFilter: (req,file,cb)=>{
    const allowedFileType = ["image/png", "image/jpg", "image/jpeg"];
    if(allowedFileType.includes(file.mimetype)){
    cb(null, true)
    }else{

        cb(new Error("Please select a valid image file (PNG, JPG, JPEG)"), false);
    }
}

}
);

const s3UploadImageRoute = require("express").Router();


s3UploadImageRoute.post("/", s3Upload.single("s3Image"),  (req,res)=>{

console.log({
    file: req.file,
    
})

res.json({message:"aws-s3-image-upload-route-success", success: true})

})

module.exports = s3UploadImageRoute;