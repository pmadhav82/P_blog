const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const Users = require("../module/user");
const Posts = require("../module/posts");
const upload = require("../fileUpload");
const sendEmail = require("../utils/sendEmail");
const { generateToken, isValidToken } = require("../utils/tokenHandeler");
const { islogin } = require("../utils/loginHandeler");
// markedjs, dompurify and jsdom init
const createDomPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const { marked } = require("marked");
const window = new JSDOM("").window;
const DOMPurify = createDomPurify(window);
const Comment = require("../module/comment");
const { postValidation } = require("../utils/userInputValidation");


router.use(islogin);







// render file upload form
router.get("/changeProfile", (req, res) => {
  res.render("uploadForm", {});
});





// Upload profile picture

router.post(
  "/upload/profile",
  upload.single("userProfile"),
  async (req, res) => {
    if (!req.file) {
      return res.redirect("/changeProfile");
    } else {
      let filePath = `/images/${req.file.filename}`;

      try {
        req.session.profileURL = filePath;
        await Users.findByIdAndUpdate(req.session.uid, {
          profileURL: filePath,
        });

        res.redirect("/welcome");
      } catch (er) {
        res.redirect("/changeProfile");

        console.log(er);
      }
    }
  }
);

module.exports = router;
