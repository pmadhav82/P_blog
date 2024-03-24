const { islogin } = require("../utils/loginHandeler");
const Users = require("../module/user");
const upload = require("../utils/fileUpload");
const { userInfoValidation } = require("../utils/userInputValidation");
const { validationResult } = require("express-validator");
const editProfileRoute = require("express").Router();

editProfileRoute.use(islogin);
editProfileRoute.get("/", async (req, res) => {
  const userId = req.session.uid;
  try {
    const user = await Users.findById(userId).select("-password").lean();
    res.render("editProfile", {
      user,
    });
  } catch (er) {
    console.log(er);
    res.redirect("/welcome");
  }
});

editProfileRoute.post(
  "/",
  upload.single("userProfile"),
  userInfoValidation,
  async (req, res) => {
    const errors = validationResult(req);
    const { name, email, bio, linkedIn, website } = req.body;

    if (!errors.isEmpty()) {
      req.flash("error", `${errors.array()[0].msg}`);
      return res.redirect("/editProfile");
    }
    const updateData = {
      name,
      email,
      bio,
      linkedIn,
      website,
    };

    if (req.file) {
      const filePath = `/images/${req.file.filename}`;
      req.session.profileURL = filePath;
      updateData.profileURL = filePath;
    }


    res.redirect("/welcome");
    try {
      await Users.findByIdAndUpdate(req.session.uid, updateData);
    } catch (er) {
      console.log(er);
      res.redirect("/welcome");
    }
  }

 
);

module.exports = editProfileRoute;
