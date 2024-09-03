const multer = require("multer");

const s3Upload = multer({
  limits: {
    fileSize: 12000000, //12mb
  },

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

module.exports = s3Upload;
