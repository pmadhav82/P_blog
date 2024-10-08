const multer = require("multer");
const path = require("path");

const upload = multer({
  limits: {
    fileSize: 8000000,
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./upload/images");
    },
    filename: (req, file, cb) => {
      let ext = path.extname(file.originalname);
      cb(null, `${req.session.uid}.${ext}`);
    },
  }),

  fileFilter: (req, file, cb) => {
    const allowedFileType = ["image/png", "image/jpg", "image/jpeg"];

    if (!allowedFileType.includes(file.mimetype)) {
      return cb(
        new Error("Please select a valid image file (PNG, JPG, JPEG)"),
        false
      );
    }

    cb(null, true);
  },
});
module.exports = upload;
