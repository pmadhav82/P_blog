 const multer = require("multer");
const path =  require("path");

const upload = multer({
    limits:800000,
    storage: multer.diskStorage({
destination:(req,file,cb)=>{
cb(null,"./upload/images")
},
filename:(req,file,cb)=>{

    let ext = path.extname(file.originalname);
cb(null,`${req.session.uid}.${ext}`)
}
    }),

    fileFilter:(req,file,cb)=>{
        const allowedFileType = ["jpg", "jpeg", "png"];
        if(allowedFileType.includes(file.mimetype.split("/")[1])){
            cb(null,true)
        }else{
            console.log("Something wrong..")
            cb(null,false)
        }
    }

})
module.exports = upload;