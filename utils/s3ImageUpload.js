const multer = require("multer");

const s3Upload = multer({
  limits: {
    fileSize: 12000000,
  },

  fileFilter: (req, file, cb) => {
    const allowedFileType = ["image/png", "image/jpg", "image/jpeg", "image/gif"];

    if (!allowedFileType.includes(file.mimetype)) {
      return cb(
        new Error("Please select a valid image file (PNG, JPG, JPEG, GIF)"),
        false
      );
    }

    cb(null, true);
  },
});

module.exports = s3Upload;
